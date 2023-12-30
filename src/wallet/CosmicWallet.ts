import bs58 from "bs58";
import {
  AccountInfo,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import nacl, { BoxKeyPair } from "tweetnacl";
import {
  DEFAULT_WALLET_SELECTOR,
  generateDiffieHellman,
  getParsedTokenBalancesForKey,
  LocalStorageAddressInfo,
  ParsedTokenBalance,
  PrivateKeyImport,
  WalletAccountData,
  WalletAccounts,
  WalletSelector,
  RefreshState,
} from "../shared";
import {
  ConnectionManager,
  PlayerProfileService,
  TransactionManager,
  WalletAdapterService,
  WalletSeedManager,
} from "../core";
import {
  autorun,
  computed,
  makeAutoObservable,
  observable,
  reaction,
  runInAction,
} from "mobx";
import {
  AsyncSigner,
  buildAndSignTransaction,
  buildDynamicTransactions,
  getParsedTokenAccountsByOwner,
  InstructionReturn,
  keypairToAsyncSigner,
  sendTransaction,
  transfer,
  createAssociatedTokenAccountIdempotent,
} from "@staratlas/data-source";
import { SupportedTransactionVersions } from "@solana/wallet-adapter-base/src/transaction";
import {
  Account,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  Mint,
  RawMint,
  unpackMint,
} from "@solana/spl-token";
import { Adapter } from "@solana/wallet-adapter-base";
import { Buffer } from "buffer";
import { setIntervalAsync } from "set-interval-async/dynamic";

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
  private static WALLET_SELECTOR_KEY = "walletSelector";
  private static WALLET_COUNT_KEY = "walletCount";
  private static WALLET_NAMES_KEY = "walletNames";

  /// Managers
  protected connectionManager = ConnectionManager.instance;
  protected seedManager = WalletSeedManager.instance;
  protected transactionManager = TransactionManager.instance;

  /// Services
  protected walletAdapterService = WalletAdapterService.instance;
  protected playerProfileService = PlayerProfileService.instance;

  /// Transaction management
  supportedTransactionVersions: SupportedTransactionVersions = new Set([
    "legacy",
  ]);
  protected data: {
    skipPreflightConfig: boolean;
  } = { skipPreflightConfig: process.env.USE_SKIP_PREFLIGHT === "true" };

  /// Wallet accounts management
  private signer: AsyncSigner<Keypair> | null = null;
  protected listAddresses:
    | ((walletCount: number) => LocalStorageAddressInfo[])
    | undefined;
  protected _walletAccounts: WalletAccounts = {
    accounts: [],
    derivedAccounts: [],
    importedAccounts: [],
  };
  protected _walletCount: number | null = null;
  protected _walletSelector: WalletSelector = DEFAULT_WALLET_SELECTOR;

  /// Token balance management
  protected _tokenAccounts: Account[] = [];
  protected _solanaBalanceInLamports = 0;
  protected _tokenBalances: Map<string, ParsedTokenBalance> = observable.map(
    new Map(),
  );
  refreshTokenState = RefreshState.Ready;
  /// Reactions
  protected _reactions: any[] = [];
  protected _asyncPolls: any[] = [];

  constructor() {
    makeAutoObservable(this);

    // Manage seed, private key, and wallet accounts
    this.setWalletSelector = this.setWalletSelector.bind(this);
    this.setWalletCount = this.setWalletCount.bind(this);
    this.setWalletName = this.setWalletName.bind(this);
    this.createReactions = this.createReactions.bind(this);
    this.addAccount = this.addAccount.bind(this);
    this.setAccountName = this.setAccountName.bind(this);
    this.create = this.create.bind(this);
    this.connect = this.connect.bind(this);
    this.initSigner = this.initSigner.bind(this);

    // Fetch and cache token balances
    this.refreshEverything = this.refreshEverything.bind(this);
    this.refreshWalletAccounts = this.refreshWalletAccounts.bind(this);
    this.refreshSolanaBalance = this.refreshSolanaBalance.bind(this);
    this.refreshTokenBalances = this.refreshTokenBalances.bind(this);
    this.refreshBalanceForMint = this.refreshBalanceForMint.bind(this);

    // Transaction handlers
    this.nativeTransfer = this.nativeTransfer.bind(this);
    this.tokenTransfer = this.tokenTransfer.bind(this);

    this.createReactions();
    this._walletSelector = this.walletSelector;

    // TODO: Convert to RPC program/account subscriptions instead of polling
    this._asyncPolls.push(
      setIntervalAsync(async () => {
        await this.refreshEverything();
      }, 1000 * 60),
    );
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
    if (!seed) return;

    this.initSigner();

    this.listAddresses = (walletCount: number): LocalStorageAddressInfo[] => {
      return [...Array(walletCount).keys()].map((walletIndex) => {
        const address = this.seedManager.seedToKeypair(
          seed,
          walletIndex,
        ).publicKey;
        const name = this.walletName(walletIndex);
        return { index: walletIndex, address, name };
      });
    };
  }

  initSigner(): void {
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) return;
    const { seed, importsEncryptionKey, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed) return;

    if (this.walletSelector.walletIndex !== undefined) {
      const account = this.seedManager.seedToKeypair(
        seed,
        this.walletSelector.walletIndex,
        derivationPath,
      );
      console.debug("Init CosmicWallet signer from seed");
      this.signer = keypairToAsyncSigner(account);
      this.refreshEverything();
    } else if (this.walletSelector.importedPubkey && importsEncryptionKey) {
      const { nonce, ciphertext } =
        this.seedManager.privateKeyImports[
          this.walletSelector.importedPubkey.toString()
        ];
      const secret: Uint8Array | null = nacl.secretbox.open(
        bs58.decode(ciphertext),
        bs58.decode(nonce),
        importsEncryptionKey,
      );
      if (secret) {
        console.debug("Init CosmicWallet signer from imported secret");
        this.signer = keypairToAsyncSigner(Keypair.fromSecretKey(secret));
        this.refreshEverything();
      } else {
        console.error("Failed to find imported wallet secret");
        return;
      }
    } else {
      console.error("No wallet selected");
      return;
    }
  }

  get allowsExport(): boolean {
    return true;
  }

  get walletAccount(): WalletAccountData | null {
    const selector = this.walletSelector;

    if (selector.walletIndex || selector.walletIndex === 0) {
      console.debug("here");
      const name = this.walletName(selector.walletIndex);
      const res: WalletAccountData = {
        selector,
        address: this.publicKey!,
        name,
        isSelected: true,
      };
      console.debug("derived", res);
      return res;
    } else if (selector.importedPubkey) {
      console.debug("there");
      const imported =
        this.seedManager.privateKeyImports[selector.importedPubkey.toString()];
      const name = imported.name;
      const res: WalletAccountData = {
        selector,
        address: selector.importedPubkey,
        name,
        isSelected: true,
      };
      console.debug("imported", res);
      return res;
    } else {
      return null;
    }
  }

  get walletAccounts(): WalletAccounts {
    return this._walletAccounts;
  }

  get tokenAccounts(): Account[] {
    return this._tokenAccounts;
  }

  get walletSelector(): WalletSelector {
    const value: string | null = localStorage.getItem(
      CosmicWallet.WALLET_SELECTOR_KEY,
    );
    let selector: WalletSelector = DEFAULT_WALLET_SELECTOR;
    if (value) {
      selector = JSON.parse(value);
    } else {
      localStorage.setItem(
        CosmicWallet.WALLET_SELECTOR_KEY,
        JSON.stringify(selector),
      );
    }
    if (JSON.stringify(this._walletSelector) !== JSON.stringify(selector)) {
      this._walletSelector = selector;
    }
    return this._walletSelector;
  }

  setWalletSelector(value: WalletSelector | null): void {
    if (value === null) {
      localStorage.removeItem(CosmicWallet.WALLET_SELECTOR_KEY);
    } else {
      localStorage.setItem(
        CosmicWallet.WALLET_SELECTOR_KEY,
        JSON.stringify(value),
      );
    }
    if (JSON.stringify(this._walletSelector) !== JSON.stringify(value)) {
      this._walletSelector = value;
    }
    this.initSigner();
  }

  get walletCount(): number {
    const value: string | null = localStorage.getItem(
      CosmicWallet.WALLET_COUNT_KEY,
    );
    if (!value) {
      localStorage.setItem(CosmicWallet.WALLET_COUNT_KEY, "1");
      this._walletCount = 1;
    }
    const parsedValue = JSON.parse(value);
    if (this._walletCount !== parsedValue) {
      this._walletCount = parsedValue;
    }
    return this._walletCount;
  }

  setWalletCount(value: number | null): void {
    if (value === null) {
      localStorage.removeItem(CosmicWallet.WALLET_COUNT_KEY);
      return;
    }
    localStorage.setItem(CosmicWallet.WALLET_COUNT_KEY, JSON.stringify(value));
    this._walletCount = value;
  }

  walletName(walletIndex: number): string | null {
    const value: string | null = localStorage.getItem(
      CosmicWallet.WALLET_NAMES_KEY,
    );
    if (!value) {
      const namesRecord: Record<number, string> = {};
      localStorage.setItem(
        CosmicWallet.WALLET_NAMES_KEY,
        JSON.stringify(namesRecord),
      );
      return null;
    } else {
      const namesRecord: Record<number, string> = JSON.parse(value);
      return namesRecord[walletIndex];
    }
  }

  get walletNames(): string[] {
    const value: string | null = localStorage.getItem(
      CosmicWallet.WALLET_NAMES_KEY,
    );
    if (!value) {
      const namesRecord: Record<number, string> = {};
      localStorage.setItem(
        CosmicWallet.WALLET_NAMES_KEY,
        JSON.stringify(namesRecord),
      );
      return [];
    } else {
      const namesRecord: Record<number, string> = JSON.parse(value);
      return Object.values(namesRecord);
    }
  }

  /// Adds a wallet to local storage
  setWalletName(walletIndex: number, name: string | null): void {
    const cache: string | null = localStorage.getItem(
      CosmicWallet.WALLET_NAMES_KEY,
    );
    let namesRecord: Record<number, string> = {};
    if (cache !== null) {
      namesRecord = JSON.parse(cache);
    }
    if (name === null && namesRecord[walletIndex]) {
      delete namesRecord[walletIndex];
    } else {
      namesRecord[walletIndex] = name;
    }
    localStorage.setItem(
      CosmicWallet.WALLET_NAMES_KEY,
      JSON.stringify(namesRecord),
    );
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

  refreshWalletAccounts(): void {
    if (!this.seedManager.currentUnlockedMnemonicAndSeed) return;
    const { seed, derivationPath } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!seed) {
      console.warn("Missing or locked seed, walletCount", this.walletCount);
      this._walletAccounts = {
        accounts: [],
        derivedAccounts: [],
        importedAccounts: [],
      };
      return;
    }

    const derivedAccounts: WalletAccountData[] = [
      ...Array(this.walletCount).keys(),
    ].map((idx) => {
      let address = this.seedManager.seedToKeypair(
        seed,
        idx,
        derivationPath,
      ).publicKey;
      const name = this.walletName(idx);
      const selector: WalletSelector = {
        walletIndex: idx,
        importedPubkey: undefined,
      };
      return {
        selector,
        isSelected: this.walletSelector.walletIndex === idx,
        address,
        name: idx === 0 ? "Main account" : name || `Account ${idx}`,
      };
    });

    const importedAccounts: WalletAccountData[] = Object.keys(
      this.seedManager.privateKeyImports,
    ).map((pubkey) => {
      const { name } = this.seedManager.privateKeyImports[pubkey];
      const selector: WalletSelector = {
        walletIndex: undefined,
        importedPubkey: new PublicKey(bs58.decode(pubkey)),
      };
      return {
        selector,
        address: new PublicKey(bs58.decode(pubkey)),
        name: `${name} (imported)`, // TODO: do this in the Component with styling.
        isSelected: this.walletSelector.importedPubkey
          ? this.walletSelector.importedPubkey.toString() === pubkey
          : false,
      };
    });

    this._walletAccounts = {
      accounts: derivedAccounts.concat(importedAccounts),
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
    const { importsEncryptionKey } =
      this.seedManager.currentUnlockedMnemonicAndSeed;
    if (!importsEncryptionKey) {
      console.error("No encryption key found in addAccount");
      return;
    }
    if (importedAccount === undefined) {
      const oldWalletCount = this.walletCount;
      this.setWalletName(oldWalletCount, name);
      this.setWalletCount(oldWalletCount + 1);
    } else {
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const plaintext = importedAccount.secretKey;
      const ciphertext = nacl.secretbox(plaintext, nonce, importsEncryptionKey);

      let newPrivateKeyImports: Record<string, PrivateKeyImport> = {
        ...this.seedManager.privateKeyImports,
      };
      newPrivateKeyImports[importedAccount.publicKey.toString()] = {
        name,
        ciphertext: bs58.encode(ciphertext),
        nonce: bs58.encode(nonce),
      };
      this.seedManager.setPrivateKeyImports(newPrivateKeyImports);
    }
    this.refreshEverything();
  }

  setAccountName(selector: WalletSelector, newName: string): void {
    if (selector.importedPubkey) {
      let newPrivateKeyImports = { ...this.seedManager.privateKeyImports };
      newPrivateKeyImports[selector.importedPubkey.toString()].name = newName;
      this.seedManager.setPrivateKeyImports(newPrivateKeyImports);
    } else if (selector.walletIndex) {
      this.setWalletName(selector.walletIndex, newName);
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
   * Fetch and cache token balances
   *
   */

  async refreshEverything(): Promise<void> {
    await this.refreshSolanaBalance();
    await this.refreshTokenBalances();
    await this.refreshWalletAccounts();
  }

  get solanaBalance(): number {
    return Number(
      (this._solanaBalanceInLamports / LAMPORTS_PER_SOL).toFixed(2),
    );
  }

  async refreshSolanaBalance(): Promise<void> {
    if (!this.publicKey) return;
    const balance = await this.connectionManager.connection.getBalance(
      this.publicKey,
    );
    this._solanaBalanceInLamports = balance;
  }

  get tokenBalances(): Map<string, ParsedTokenBalance> {
    return this._tokenBalances;
  }

  async refreshTokenBalances(): Promise<void> {
    if (!this.publicKey) return;

    this.refreshTokenState = RefreshState.Pending;
    const balances = await getParsedTokenBalancesForKey(
      this.connectionManager.connection,
      this.publicKey,
    );

    this._tokenBalances.clear();

    runInAction(() => {
      for (const balance of balances) {
        this._tokenBalances.set(balance.mint, balance);
      }
      console.log("refreshed token balances");
      this.refreshTokenState = RefreshState.Ready;
    });
  }

  async refreshBalanceForMint(mint: string): Promise<void> {
    if (!this.publicKey) return;

    const tokenAccount = getAssociatedTokenAddressSync(
      new PublicKey(mint),
      this.publicKey,
    );

    try {
      const balance =
        await this.connectionManager.connection.getTokenAccountBalance(
          tokenAccount,
        );

      if (balance.value.uiAmount) {
        this.tokenBalances.delete(mint);
        this.tokenBalances.set(mint, {
          uiAmount: balance.value.uiAmount,
          tokenAccount: tokenAccount.toBase58(),
          mint,
          owner: this.publicKey.toString(),
        });
      }
    } catch (e) {
      console.debug("Token account does not exist: ", tokenAccount.toBase58());
    }
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
    await this.refreshEverything();

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
    await this.refreshEverything();

    // todo: push to transaction history
    // todo: toast notification
  }
}
