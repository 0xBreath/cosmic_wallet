import bs58 from "bs58";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import nacl, { BoxKeyPair } from "tweetnacl";
import {
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
  TokenManager,
  TransactionManager,
  WalletAdapterService,
  WalletSeedManager,
} from "../core";
import { autorun, makeAutoObservable, reaction } from "mobx";
import { AsyncSigner, keypairToAsyncSigner } from "@staratlas/data-source";
import { Adapter } from "@solana/wallet-adapter-base";

export class CosmicWallet {
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
  protected _walletCount: number = 1;
  protected _walletAccount: WalletAccount | null = null;
  protected _walletNames: Record<Address, Name> = {};

  /// Reactions
  protected _reactions: any[] = [];

  constructor() {
    makeAutoObservable(this);

    this.tokenManager = new TokenManager(this.publicKey);

    // Manage derived account index
    this.setWalletCount = this.setWalletCount.bind(this);

    // Manage wallet account names
    this.setWalletName = this.setWalletName.bind(this);
    this.walletName = this.walletName.bind(this);
    this.walletAccountByName = this.walletAccountByName.bind(this);

    // Mange creating new derived or imported accounts
    this.createAccount = this.createAccount.bind(this);
    this.createAndSetAccount = this.createAndSetAccount.bind(this);
    this.createDerivedAccount = this.createDerivedAccount.bind(this);
    this.createImportedAccount = this.createImportedAccount.bind(this);

    // Manage initializing signer/wallet from existing derived or imported account
    this.initSigner = this.initSigner.bind(this);
    this.initDerivedAccount = this.initDerivedAccount.bind(this);
    this.initImportedAccount = this.initImportedAccount.bind(this);
    this.initNewAccount = this.initNewAccount.bind(this);

    // Set active wallet account and its name
    this.setWalletAccount = this.setWalletAccount.bind(this);
    this.setAccountName = this.setAccountName.bind(this);

    // Transaction handlers
    this.nativeTransfer = this.nativeTransfer.bind(this);
    this.tokenTransfer = this.tokenTransfer.bind(this);

    // Misc
    this.createReactions = this.createReactions.bind(this);
    this.connect = this.connect.bind(this);

    // Initial setup
    this.createReactions();
    this.refreshWalletAccounts();
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
      this.initSigner();
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

  initSigner(): void {
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) return;
    const { seed, importsEncryptionKey, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed || !importsEncryptionKey) return;

    if (!this.walletAccount) {
      this.initNewAccount();
    } else {
      if (this.isImported(this.walletAccount)) {
        this.initImportedAccount();
      } else {
        this.initDerivedAccount();
      }
    }
    this.refreshWalletAccounts();
    this.tokenManager.refreshEverything();
    if (!this.signer || !this.publicKey) {
      throw new Error("Failed to init signer");
    }
    this.tokenManager = new TokenManager(this.publicKey);
  }

  initImportedAccount(): void {
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) {
      throw new Error(
        "initImportedAccount: Missing unlocked mnemonic and seed",
      );
    }
    const { seed, importsEncryptionKey, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed || !importsEncryptionKey) {
      throw new Error(
        "initImportedAccount: Missing seed or importsEncryptionKey",
      );
    }
    const account = this.walletAccount as ImportedAccount;
    const secret: Uint8Array | null = nacl.secretbox.open(
      bs58.decode(account.ciphertext),
      bs58.decode(account.nonce),
      importsEncryptionKey,
    );
    if (!secret) {
      console.error("Failed to find imported wallet secret");
      throw new Error("initImportedAccount: secret is undefined");
    }
    console.log("Init import signer");
    const keypair = Keypair.fromSecretKey(secret);
    this.signer = keypairToAsyncSigner(keypair);
    this.setWalletAccount(account as WalletAccount);
  }

  initDerivedAccount(): void {
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) {
      throw new Error("initDerivedAccount: Missing unlocked mnemonic and seed");
    }
    const { seed, importsEncryptionKey, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed || !importsEncryptionKey) {
      throw new Error(
        "initDerivedAccount: Missing seed or importsEncryptionKey",
      );
    }
    if (!this.walletAccount) {
      throw new Error("initDerivedAccount: Missing walletAccount");
    }
    let account = this.walletAccount as DerivedAccount;
    if (!account.keypair) {
      account.keypair = this.seedManager.seedToKeypair(
        seed,
        account.walletIndex,
        derivationPath,
      );
    }
    const name = this.walletName(account.keypair.publicKey);
    if (!name) {
      throw new Error(
        `Missing name for derived account: ${account.keypair.publicKey.toString()}`,
      );
    }
    account.name = name;
    this.signer = keypairToAsyncSigner(account.keypair);
    this.setWalletAccount(account as WalletAccount);
    console.log(
      "Update derived signer from seed: ",
      name,
      this.signer.publicKey().toString(),
    );
  }

  /// Functions the same as `createDerivedAccount`
  /// but also sets the new account as the current wallet.
  /// Used for creating the first account from the mnemonic.
  initNewAccount(): void {
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) {
      throw new Error("initNewAccount: Missing unlocked mnemonic and seed");
    }
    const { seed, importsEncryptionKey, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed || !importsEncryptionKey) {
      throw new Error("initNewAccount: Missing seed or importsEncryptionKey");
    }

    const keypair = this.seedManager.seedToKeypair(seed, 0, derivationPath);
    const name = "Main account";
    const account: DerivedAccount = {
      keypair,
      name,
      isSelected: true,
      walletIndex: 0,
    };
    this.signer = keypairToAsyncSigner(keypair);
    this.setWalletName(keypair.publicKey, name);
    this.setWalletAccount(account as WalletAccount);
    this.setWalletCount(1);
    console.log(
      "Init new derived signer",
      name,
      this.signer.publicKey().toString(),
    );
  }

  createReactions(): void {
    this.initSigner();
    this._reactions.push(
      reaction(
        () => this.seedManager.unlockedMnemonicAndSeed,
        () => {
          this.initSigner();
        },
      ),
    );
    this._reactions.push(
      reaction(
        () => this.walletAccount,
        () => {
          this.initSigner();
        },
      ),
    );
    // this._reactions.push(
    //   autorun(() => {
    //     console.log("autorun");
    //     this.initSigner();
    //   }),
    // );
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
   * Wallet derived account index
   *
   */

  get walletCount(): number {
    const value: string | null = localStorage.getItem(
      CosmicWallet.WALLET_COUNT_KEY,
    );
    if (!value) {
      console.log("wallet count is null");
      localStorage.setItem(
        CosmicWallet.WALLET_COUNT_KEY,
        this._walletCount.toString(),
      );
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

  /*
   *
   * Manage account names
   *
   */

  get walletNames(): Record<Address, Name> {
    return this._walletNames;
  }

  setAccountName(account: WalletAccount, newName: string): void {
    if (!account.keypair) return;
    if (this.isImported(account)) {
      let importedAccounts: Record<Address, ImportedAccount> =
        this.seedManager.importedAccounts;
      importedAccounts[account.keypair.publicKey.toString()].name = newName;
      this.seedManager.setImportedAccounts(importedAccounts);
    }
    this.setWalletName(account.keypair.publicKey, newName);
    this.refreshWalletAccounts();
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

  walletAccountByName(name: string): WalletAccount | null {
    const account: WalletAccount | undefined = [
      ...Object.values(this._walletAccounts.accounts),
    ].find((account) => {
      if (account.name === name) {
        return account;
      }
    });
    if (account) {
      return account;
    } else {
      return null;
    }
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

  /*
   *
   * Create new derived or imported account
   *
   */

  createAndSetAccount(name: string, importedAccount?: Keypair): void {
    this.createAccount({ name, importedAccount });
    const newAccount = this.walletAccountByName(name);
    if (!newAccount || !newAccount.keypair) {
      console.error("Missing new account");
      return;
    }
    console.log(
      "new account",
      newAccount.name,
      shortenAddress(newAccount.keypair.publicKey.toString()),
    );
    this.setWalletAccount(newAccount);
  }

  /// Generates new keypair based on walletIndex (basically a derived account nonce)
  /// If this is the first wallet account, use `initNewAccount` instead.
  createDerivedAccount(name: string): void {
    if (!this.publicKey) return;
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) return;
    const { seed, importsEncryptionKey, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed || !importsEncryptionKey) {
      console.error("No encryption key found in addAccount");
      return;
    }

    const index = this.walletCount;
    const keypair = this.seedManager.seedToKeypair(seed, index);
    this.setWalletName(keypair.publicKey, name);
    this.setWalletCount(index + 1);
  }

  createImportedAccount(name: string, importedAccount: Keypair) {
    if (!this.publicKey) return;
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) return;
    const { seed, importsEncryptionKey, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed || !importsEncryptionKey) {
      console.error("No encryption key found in addAccount");
      return;
    }

    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const plaintext = importedAccount.secretKey;
    const ciphertext = nacl.secretbox(plaintext, nonce, importsEncryptionKey);

    const importedAccounts: Record<Address, ImportedAccount> =
      this.seedManager.importedAccounts;
    importedAccounts[importedAccount.publicKey.toString()] = {
      keypair: importedAccount,
      name,
      ciphertext: bs58.encode(ciphertext),
      nonce: bs58.encode(nonce),
      importedPublicKey: importedAccount.publicKey,
      isSelected:
        importedAccount.publicKey.toString() === this.publicKey.toString(),
    };
    this.seedManager.setImportedAccounts(importedAccounts);
    this.setWalletName(importedAccount.publicKey, name);
  }

  createAccount({
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
      this.createDerivedAccount(name);
    } else {
      this.createImportedAccount(name, importedAccount);
    }
    this.refreshWalletAccounts();
    this.tokenManager.refreshEverything();
  }

  isImported(selector: WalletAccount): boolean {
    return "importedPublicKey" in selector;
  }

  diffieHellman(key: PublicKey): BoxKeyPair | null {
    if (!this.signer || !this.signer.inner) return null;
    const secret = this.signer.inner().secretKey;
    return generateDiffieHellman(key, secret);
  }

  /*
   *
   * Read or set update accounts
   *
   */

  get walletAccounts(): WalletAccounts {
    return this._walletAccounts;
  }

  get walletAccount(): WalletAccount | null {
    return this._walletAccount;
  }

  setWalletAccount(value: WalletAccount): void {
    localStorage.setItem(
      CosmicWallet.WALLET_ACCOUNT_KEY,
      JSON.stringify(value),
    );
    this._walletAccount = value;
  }

  get derivedAccounts(): DerivedAccount[] {
    if (!this || !this.publicKey) return [];
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

    const derivedAccounts: DerivedAccount[] = this.derivedAccounts;
    const importedAccounts: ImportedAccount[] = [
      ...Object.values(this.seedManager.importedAccounts),
    ];
    const accounts: WalletAccount[] = [...derivedAccounts, ...importedAccounts];
    console.debug("wallet accounts: ", accounts.length);

    this._walletAccounts = {
      accounts,
      derivedAccounts,
      importedAccounts,
    };
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
