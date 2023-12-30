import bs58 from "bs58";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import nacl, { BoxKeyPair } from "tweetnacl";
import {
  DEFAULT_WALLET_ACCOUNT,
  generateDiffieHellman,
  ParsedTokenBalance,
  RefreshState,
  WalletAccounts,
  Address,
  Name,
  shortenAddress,
  WalletAccount,
  DerivedAccount,
  ImportedAccount,
} from "../shared";
import {
  ConnectionManager,
  PlayerProfileService,
  TokenManager,
  TransactionManager,
  WalletAdapterService,
  WalletSeedManager,
} from "../core";
import { autorun, makeAutoObservable, reaction } from "mobx";
import { AsyncSigner, keypairToAsyncSigner } from "@staratlas/data-source";
import { Adapter } from "@solana/wallet-adapter-base";

export class CosmicWallet {
  /// Constructor
  private static _instance: CosmicWallet;
  static get instance(): CosmicWallet {
    if (!this._instance) {
      this._instance = new CosmicWallet();
    }
    return this._instance;
  }

  /// Constants
  private static WALLET_ACCOUNT_KEY = "walletAccount";
  private static WALLET_COUNT_KEY = "walletCount";
  private static WALLET_NAMES_KEY = "walletNames";

  /// Managers
  protected connectionManager = ConnectionManager.instance;
  protected seedManager = WalletSeedManager.instance;
  protected transactionManager = TransactionManager.instance;
  protected tokenManager = new TokenManager(null);

  /// Services
  protected walletAdapterService = WalletAdapterService.instance;

  /// Wallet accounts management
  private signer: AsyncSigner<Keypair> | null = null;
  protected _walletAccounts: WalletAccounts = {
    accounts: [],
    derivedAccounts: [],
    importedAccounts: [],
  };
  protected _walletCount: number = 0;
  protected _walletAccount: WalletAccount = DEFAULT_WALLET_ACCOUNT;
  protected _walletNames: Record<Address, Name> = {};

  /// Reactions
  protected _reactions: any[] = [];

  constructor() {
    makeAutoObservable(this);

    this.tokenManager = new TokenManager(this.publicKey);

    // Manage seed, private key, and wallet accounts
    this.setWalletAccount = this.setWalletAccount.bind(this);
    this.setWalletCount = this.setWalletCount.bind(this);
    this.setWalletName = this.setWalletName.bind(this);
    this.createReactions = this.createReactions.bind(this);
    this.addAccount = this.addAccount.bind(this);
    this.setAccountName = this.setAccountName.bind(this);
    this.create = this.create.bind(this);
    this.connect = this.connect.bind(this);
    this.initSigner = this.initSigner.bind(this);
    this.addAndSetAccount = this.addAndSetAccount.bind(this);
    this.walletAccountByName = this.walletAccountByName.bind(this);

    // Transaction handlers
    this.nativeTransfer = this.nativeTransfer.bind(this);
    this.tokenTransfer = this.tokenTransfer.bind(this);

    this.createReactions();
  }

  /*
   *
   * Implement [`BaseSignerWalletAdapter`]
   *
   */

  get secretKey(): Uint8Array | null {
    const signer = this.signer;
    if (!signer) return null;
    const keypair: Keypair | null = signer.inner ? signer.inner() : null;
    return keypair ? keypair.secretKey : null;
  }

  get publicKey(): PublicKey | null {
    if (!this.signer) {
      return null;
    }
    return this.signer.publicKey();
  }

  get connected(): boolean {
    return !!this.publicKey;
  }

  connect(): void {
    if (!this.signer || !this.publicKey) {
      this.create();
    }
    return;
  }

  get connection(): Connection {
    return this.connectionManager.connection;
  }

  get supportedWallets(): Adapter[] {
    return this.walletAdapterService.getAdaptors();
  }

  /// TODO: support versioned transactions
  signTransaction<T extends Transaction>(transaction: T): Promise<T> {
    if (!this.signer) {
      throw new Error("Signer is not initialized for signing");
    }
    const result = this.signer.sign(transaction as Transaction);
    return result as Promise<T>;
  }

  createSignature(message: Uint8Array): string | null {
    if (!this.signer) return null;
    const signer: AsyncSigner<Keypair> = this.signer;
    const keypair = signer.inner ? signer.inner() : undefined;
    if (!keypair) return null;
    return bs58.encode(nacl.sign.detached(message, keypair.secretKey));
  }

  /*
   *
   * Manage seed, private key, and wallet accounts
   *
   */

  /// If it exists, it loads all addresses associated with the seed.
  async create(): Promise<void> {
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) return;
    const { seed } = this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed) {
      console.log("No seed in create");
      return;
    }

    this.initSigner();
  }

  initSigner(): void {
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) return;
    const { seed, importsEncryptionKey, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed || !importsEncryptionKey) return;

    if (!this.isImported(this.walletAccount)) {
      let account = this.walletAccount as DerivedAccount;
      if (!account.keypair) {
        account.keypair = this.seedManager.seedToKeypair(
          seed,
          account.walletIndex,
          derivationPath,
        );
      }
      if (!account.name) {
        account.name = "Main account";
      }
      console.debug(
        "Init CosmicWallet signer from seed",
        JSON.stringify(account),
      );
      this.signer = keypairToAsyncSigner(account.keypair);
    } else {
      const account = this.walletAccount as ImportedAccount;
      const { nonce, ciphertext } =
        this.seedManager.importedAccounts[
          account.keypair?.publicKey.toString()
        ];
      const secret: Uint8Array | null = nacl.secretbox.open(
        bs58.decode(account.ciphertext),
        bs58.decode(account.nonce),
        importsEncryptionKey,
      );
      if (!secret) {
        console.error("Failed to find imported wallet secret");
        return;
      }
      console.debug(
        "Init CosmicWallet signer from imported secret",
        JSON.stringify(account),
      );
      this.signer = keypairToAsyncSigner(Keypair.fromSecretKey(secret));
    }

    this.tokenManager.refreshEverything();
    this.tokenManager = new TokenManager(this.signer.publicKey());
  }

  createReactions(): void {
    this._reactions.push(
      autorun(() => {
        this.refreshWalletAccounts();
      }),
    );
    this._reactions.push(
      reaction(
        () => this.seedManager.unlockedMnemonicAndSeed,
        () => {
          this.create();
        },
      ),
    );
  }

  /*
   *
   * Tokens
   *
   */

  get refreshTokenState(): RefreshState {
    return this.tokenManager.refreshTokenState;
  }

  get solanaBalance(): number {
    return this.tokenManager.solanaBalance;
  }

  get tokenBalances(): Map<string, ParsedTokenBalance> {
    return this.tokenManager.tokenBalances;
  }

  /*
   *
   * Wallet accounts
   *
   */

  get walletAccounts(): WalletAccounts {
    return this._walletAccounts;
  }

  get walletAccount(): WalletAccount {
    const value: string | null = localStorage.getItem(
      CosmicWallet.WALLET_ACCOUNT_KEY,
    );
    let account = this._walletAccount;
    if (value) {
      account = JSON.parse(value);
    }
    this._walletAccount = account;
    return this._walletAccount;
  }

  setWalletAccount(value: WalletAccount): void {
    if (value === null) {
      localStorage.removeItem(CosmicWallet.WALLET_ACCOUNT_KEY);
    } else {
      localStorage.setItem(
        CosmicWallet.WALLET_ACCOUNT_KEY,
        JSON.stringify(value),
      );
    }
    if (JSON.stringify(this._walletAccount) !== JSON.stringify(value)) {
      this._walletAccount = value;
    }
    this.initSigner();
  }

  addAndSetAccount(name: string, importedAccount?: Keypair): void {
    console.debug("addAndSetAccount", name);
    this.addAccount({ name, importedAccount });
    const newAccount = this.walletAccountByName(name);
    if (!newAccount || !newAccount.keypair) {
      console.error("Missing new account");
      return;
    }
    console.debug(
      "newAccount",
      shortenAddress(newAccount.keypair.publicKey.toString()),
    );
    this.setWalletAccount(newAccount);
  }

  get walletCount(): number {
    const value: string | null = localStorage.getItem(
      CosmicWallet.WALLET_COUNT_KEY,
    );
    if (!value) {
      localStorage.setItem(CosmicWallet.WALLET_COUNT_KEY, "1");
      this._walletCount = 1;
      return this._walletCount;
    } else {
      const parsedValue = JSON.parse(value);
      if (this._walletCount !== parsedValue) {
        this._walletCount = parsedValue;
      }
      return this._walletCount;
    }
  }

  setWalletCount(value: number | null): void {
    if (value === null) {
      localStorage.removeItem(CosmicWallet.WALLET_COUNT_KEY);
      return;
    }
    localStorage.setItem(CosmicWallet.WALLET_COUNT_KEY, JSON.stringify(value));
    this._walletCount = value;
  }

  walletAccountByName(name: string): WalletAccount | null {
    [...Object.values(this._walletAccounts.accounts)].find((account) => {
      if (account.name === name) {
        return account;
      }
    });
    return null;
  }

  walletName(address: PublicKey): string | null {
    const value: string | null = localStorage.getItem(
      CosmicWallet.WALLET_NAMES_KEY,
    );
    if (!value) {
      const namesRecord: Record<Address, Name> = {};
      localStorage.setItem(
        CosmicWallet.WALLET_NAMES_KEY,
        JSON.stringify(namesRecord),
      );
      this._walletNames = namesRecord;
      return null;
    }

    const namesRecord: Record<Address, Name> = JSON.parse(value);
    if (namesRecord[address.toString()]) {
      return namesRecord[address.toString()];
    } else {
      namesRecord[address.toString()] = shortenAddress(address.toString());
    }
    this._walletNames = namesRecord;
    return namesRecord[address.toString()];
  }

  get walletNames(): Record<Address, Name> {
    return this._walletNames;
  }

  /// Adds a wallet to local storage
  setWalletName(address: PublicKey, name: string | null): void {
    const cache: string | null = localStorage.getItem(
      CosmicWallet.WALLET_NAMES_KEY,
    );
    let namesRecord: Record<Address, Name> = {};
    if (cache !== null) {
      namesRecord = JSON.parse(cache);
    }
    if (!name && namesRecord[address.toString()]) {
      delete namesRecord[address.toString()];
    } else if (name) {
      namesRecord[address.toString()] = name;
    }
    localStorage.setItem(
      CosmicWallet.WALLET_NAMES_KEY,
      JSON.stringify(namesRecord),
    );
    this._walletNames = namesRecord;
  }

  get derivedAccounts(): DerivedAccount[] {
    console.log("get derivedAccounts");
    if (!this) return [];
    if (!this.publicKey) return [];
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) return [];
    const { seed, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed) return [];

    const res: DerivedAccount[] = [...Array(this.walletCount).keys()].map(
      (idx) => {
        const keypair = this.seedManager.seedToKeypair(
          seed,
          idx,
          derivationPath,
        );
        const name = this.walletName(keypair.publicKey);
        if (!name) {
          throw new Error(
            `Missing name for derived account: ${keypair.publicKey.toString()}`,
          );
        }
        return {
          keypair,
          name,
          isSelected:
            keypair.publicKey.toString() === this.publicKey?.toString(),
          walletIndex: idx,
        };
      },
    );
    return res;
  }

  refreshWalletAccounts(): void {
    if (!this.publicKey) return;
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) return;
    const { seed, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed) {
      console.warn("Missing or locked seed, walletCount", this._walletCount);
      this._walletAccounts = {
        accounts: [],
        derivedAccounts: [],
        importedAccounts: [],
      };
      return;
    }

    console.log("refreshWalletAccounts before derivedAccounts");
    const derivedAccounts: DerivedAccount[] =
      this._walletAccounts.derivedAccounts;
    console.log("refreshWalletAccounts before derivedAccounts");
    const importedAccounts: ImportedAccount[] = [
      ...Object.values(this.seedManager.importedAccounts),
    ];
    const accounts = (derivedAccounts as WalletAccount[]).concat(
      importedAccounts as WalletAccount[],
    );

    this._walletAccounts = {
      accounts,
      derivedAccounts,
      importedAccounts,
    };
  }

  addAccount({
    name,
    importedAccount,
  }: {
    name: string;
    importedAccount?: Keypair;
  }): void {
    if (!this.publicKey) return;
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) return;
    const { seed, importsEncryptionKey, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed || !importsEncryptionKey) {
      console.error("No encryption key found in addAccount");
      return;
    }

    if (!importedAccount) {
      const oldWalletCount = this.walletCount;
      // generates new keypair based on walletIndex (basically a derived account nonce)
      const keypair = this.seedManager.seedToKeypair(seed, oldWalletCount);
      this.setWalletName(keypair.publicKey, name);
      this.setWalletCount(oldWalletCount + 1);
    } else {
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const plaintext = importedAccount.secretKey;
      const ciphertext = nacl.secretbox(plaintext, nonce, importsEncryptionKey);

      let newPrivateKeyImports: Record<string, ImportedAccount> = {
        ...this.seedManager.importedAccounts,
      };
      newPrivateKeyImports[importedAccount.publicKey.toString()] = {
        keypair: importedAccount,
        name,
        ciphertext: bs58.encode(ciphertext),
        nonce: bs58.encode(nonce),
        isSelected:
          importedAccount.publicKey.toString() === this.publicKey.toString(),
      };
      this.seedManager.setImportedAccounts(newPrivateKeyImports);
    }
    this.refreshWalletAccounts();
    this.tokenManager.refreshEverything();
  }

  isImported(selector: WalletAccount): boolean {
    return !("walletIndex" in selector);
  }

  setAccountName(account: WalletAccount, newName: string): void {
    if (!account.keypair) return;
    if (this.isImported(account)) {
      let importedAccounts = { ...this.seedManager.importedAccounts };
      importedAccounts[account.keypair.publicKey.toString()].name = newName;
      this.seedManager.setImportedAccounts(importedAccounts);
    } else {
      this.setWalletName(account.keypair.publicKey, newName);
    }
    this.refreshWalletAccounts();
  }

  diffieHellman(key: PublicKey): BoxKeyPair | null {
    if (!this.signer || !this.signer.inner) return null;
    const secret = this.signer.inner().secretKey;
    return generateDiffieHellman(key, secret);
  }

  /*
   *
   * Transaction builders
   *
   */

  async nativeTransfer(destination: PublicKey, amount: number): Promise<void> {
    if (!this.signer) return;

    await this.transactionManager.nativeTransfer(
      this.signer,
      destination,
      amount,
    );
    await this.tokenManager.refreshEverything();

    // todo: push to transaction history
    // todo: toast notification
  }

  async tokenTransfer(
    mint: PublicKey,
    destination: PublicKey,
    amount: number,
  ): Promise<void> {
    if (!this.signer) return;

    await this.transactionManager.tokenTransfer(
      this.signer,
      mint,
      destination,
      amount,
    );
    await this.tokenManager.refreshEverything();

    // todo: push to transaction history
    // todo: toast notification
  }
}
