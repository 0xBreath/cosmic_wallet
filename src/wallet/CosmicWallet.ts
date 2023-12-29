import bs58 from "bs58";
import base58 from "bs58";
import {
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
} from "../shared";
import {
  ConnectionModel,
  PlayerProfileService,
  WalletAdapterService,
  WalletSeedModel,
} from "../core";
import {
  autorun,
  computed,
  makeAutoObservable,
  observable,
  runInAction,
} from "mobx";
import {
  AsyncSigner,
  buildAndSignTransaction,
  buildDynamicTransactions,
  formatExplorerLink,
  getParsedTokenAccountsByOwner,
  InstructionReturn,
  keypairToAsyncSigner,
  sendTransaction,
} from "@staratlas/data-source";
import { SupportedTransactionVersions } from "@solana/wallet-adapter-base/src/transaction";
import { Account, getAssociatedTokenAddressSync } from "@solana/spl-token";
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

  /// Models
  protected connectionModel = ConnectionModel.instance;
  protected seedModel = WalletSeedModel.instance;

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
  /// Reactions
  protected _reactions: any[] = [];
  protected _asyncPolls: any[] = [];

  constructor() {
    makeAutoObservable(this);

    this.setWalletSelector = this.setWalletSelector.bind(this);
    this.setWalletCount = this.setWalletCount.bind(this);
    this.setWalletName = this.setWalletName.bind(this);
    this.createReactions = this.createReactions.bind(this);
    this.addAccount = this.addAccount.bind(this);
    this.setAccountName = this.setAccountName.bind(this);
    this.sendTransaction = this.sendTransaction.bind(this);
    this.sendDynamicTransaction = this.sendDynamicTransaction.bind(this);
    this.refreshSolanaBalance = this.refreshSolanaBalance.bind(this);
    this.refreshTokenBalances = this.refreshTokenBalances.bind(this);
    this.refreshBalanceForMint = this.refreshBalanceForMint.bind(this);
    this.create = this.create.bind(this);
    this.connect = this.connect.bind(this);
    this.initSigner = this.initSigner.bind(this);
    this.refreshWalletAccounts = this.refreshWalletAccounts.bind(this);
    this.fetchAllTokenAccounts = this.fetchAllTokenAccounts.bind(this);
    this.logTransactionResult = this.logTransactionResult.bind(this);
    this.formatExplorerAccountLink = this.formatExplorerAccountLink.bind(this);

    this.createReactions();
    this.setWalletSelector(DEFAULT_WALLET_SELECTOR);

    // todo: async set interval
    this._asyncPolls.push(
      setIntervalAsync(async () => {
        await this.fetchAllTokenAccounts();
        await this.refreshSolanaBalance();
        await this.refreshTokenBalances();
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
      console.log("get publicKey, signer is null");
      return null;
    }
    console.log("get publicKey valid");
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
    return this.connectionModel.connection;
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
    if (!this.seedModel.currentUnlockedMnemonicAndSeed) return;
    const { seed } = this.seedModel.currentUnlockedMnemonicAndSeed;
    if (!seed) return;

    this.initSigner();

    this.listAddresses = (walletCount: number): LocalStorageAddressInfo[] => {
      return [...Array(walletCount).keys()].map((walletIndex) => {
        const address = this.seedModel.seedToKeypair(
          seed,
          walletIndex,
        ).publicKey;
        const name = this.walletName(walletIndex);
        return { index: walletIndex, address, name };
      });
    };

    this.refreshSolanaBalance();
    this.refreshTokenBalances();
  }

  initSigner(): void {
    if (!this.seedModel.currentUnlockedMnemonicAndSeed) return;
    const { seed, importsEncryptionKey, derivationPath } =
      this.seedModel.currentUnlockedMnemonicAndSeed;
    if (!seed) return;

    if (this.walletSelector.walletIndex !== undefined) {
      const account = this.seedModel.seedToKeypair(
        seed,
        this.walletSelector.walletIndex,
        derivationPath,
      );
      console.debug("Init CosmicWallet signer from seed");
      this.signer = keypairToAsyncSigner(account);
    } else if (this.walletSelector.importedPubkey && importsEncryptionKey) {
      console.log(
        "initSigner: ",
        this.walletSelector.importedPubkey.toString(),
      );
      const { nonce, ciphertext } =
        this.seedModel.privateKeyImports[
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
      if (value.importedPubkey) {
        console.log("set imported wallet: ", value.importedPubkey?.toString());
      } else {
        console.log("set derived wallet: ", value.account.publicKey.toString());
      }
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

  // todo: this isn't auto running...
  createReactions(): void {
    // this._reactions.push(
    //   autorun(() => {
    //     this.create();
    //   }),
    // );
    this._reactions.push(
      autorun(() => {
        this.refreshWalletAccounts();
      }),
    );
  }

  refreshWalletAccounts(): void {
    if (!this.seedModel.currentUnlockedMnemonicAndSeed) return;
    const { seed, derivationPath } =
      this.seedModel.currentUnlockedMnemonicAndSeed;
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
      let address = this.seedModel.seedToKeypair(
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
      this.seedModel.privateKeyImports,
    ).map((pubkey) => {
      const { name } = this.seedModel.privateKeyImports[pubkey];
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
      this.seedModel.currentUnlockedMnemonicAndSeed;
    if (!importsEncryptionKey) {
      console.error("No encryption key found in addAccount");
      return;
    }
    if (importedAccount === undefined) {
      const oldWalletCount = this.walletCount;
      this.setWalletName(oldWalletCount, name);
      this.setWalletCount(oldWalletCount + 1);
    } else {
      console.log("addAccount imported");
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const plaintext = importedAccount.secretKey;
      const ciphertext = nacl.secretbox(plaintext, nonce, importsEncryptionKey);

      let newPrivateKeyImports: Record<string, PrivateKeyImport> = {
        ...this.seedModel.privateKeyImports,
      };
      newPrivateKeyImports[importedAccount.publicKey.toString()] = {
        name,
        ciphertext: bs58.encode(ciphertext),
        nonce: bs58.encode(nonce),
      };
      console.log(
        "update private key imports",
        importedAccount.publicKey.toString(),
      );
      this.seedModel.setPrivateKeyImports(newPrivateKeyImports);
    }
    this.refreshWalletAccounts();
  }

  setAccountName(selector: WalletSelector, newName: string): void {
    if (selector.importedPubkey) {
      let newPrivateKeyImports = { ...this.seedModel.privateKeyImports };
      newPrivateKeyImports[selector.importedPubkey.toString()].name = newName;
      this.seedModel.setPrivateKeyImports(newPrivateKeyImports);
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
   * Fetch and cache token balances for wallet
   *
   */

  async fetchAllTokenAccounts(): Promise<void> {
    if (!this.publicKey) return;
    this._tokenAccounts = await getParsedTokenAccountsByOwner(
      this.connection,
      this.publicKey,
    );
  }

  get solanaBalance(): number {
    return this._solanaBalanceInLamports / LAMPORTS_PER_SOL;
  }

  async refreshSolanaBalance(): Promise<void> {
    if (!this.publicKey) return;

    const balance = await this.connectionModel.connection.getBalance(
      this.publicKey,
    );
    console.log("balance", balance);

    this._solanaBalanceInLamports = balance;
  }

  get tokenBalances(): Map<string, ParsedTokenBalance> {
    return this._tokenBalances;
  }

  async refreshTokenBalances(): Promise<void> {
    if (!this.publicKey) return;

    const balances = await getParsedTokenBalancesForKey(
      this.connectionModel.connection,
      this.publicKey,
    );

    this._tokenBalances.clear();

    runInAction(() => {
      for (const balance of balances) {
        this._tokenBalances.set(balance.mint, balance);
      }
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
        await this.connectionModel.connection.getTokenAccountBalance(
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
   * Manage building, signing, and sending transactions
   *
   */

  async sendTransaction(
    instructions: InstructionReturn | InstructionReturn[],
  ): Promise<TransactionSignature[] | null> {
    if (!this.signer) return null;

    const transaction = await buildAndSignTransaction(
      instructions,
      this.signer,
      {
        connection: this.connectionModel.connection,
      },
    );

    this.logTransactionResult(transaction.transaction);

    const result = await sendTransaction(
      transaction,
      this.connectionModel.connection,
      {
        sendOptions: { skipPreflight: this.data.skipPreflightConfig ?? true },
      },
    );

    const sigOrErr = result.value;

    if (sigOrErr.isErr()) {
      console.error("Transaction error", JSON.stringify(sigOrErr, null, 2));
      return null;
    }

    console.debug("Transaction result:", transaction);
    this.refreshSolanaBalance();
    this.refreshTokenBalances();

    return [sigOrErr.value];
  }

  /**
   * This method should be used to sign + send an arbitrary amount of instructions with one button click.
   * Packs as many instructions into each transaction as possible, so use this for efficiency.
   * This does not provide functionality to define which instructions go into which transactions.
   * To send each instruction individually, see `sendInstructionsSeparately`.
   */
  async sendDynamicTransaction(
    instructions: InstructionReturn[],
  ): Promise<TransactionSignature[] | null> {
    if (!this.signer || !this.playerProfileService.anchorProgram) return null;

    try {
      const result = await buildDynamicTransactions(instructions, this.signer, {
        connection: this.connectionModel.connection,
      });

      if (!result.isOk()) {
        console.error("Transaction error", JSON.stringify(result, null, 2));
        return null;
      }

      for (const transaction of result.value) {
        this.logTransactionResult(transaction.transaction);

        try {
          const response = await sendTransaction(
            transaction,
            this.connectionModel.connection,
            {
              sendOptions: {
                skipPreflight: this.data.skipPreflightConfig ?? true,
              },
            },
          );

          console.debug("Transaction result:", response);
        } catch (e) {
          console.error(e);
          throw e;
        }
      }
      this.refreshSolanaBalance();
      this.refreshTokenBalances();

      return result.value
        .map((tx) => tx.transaction.signature)
        .filter((sig): sig is Buffer => !!sig)
        .map((sig) => base58.encode(sig));
    } catch (err) {
      console.debug("Failed to build transactions", err);
      return null;
    }
  }

  logTransactionResult(transaction: Transaction): void {
    if (!transaction.signature) {
      console.debug("Transaction has no signature");
      return;
    }

    console.debug(
      `Explorer link: ${formatExplorerLink(
        bs58.encode(transaction.signature),
        this.connectionModel.connection,
      )}`,
    );
  }

  formatExplorerAccountLink(key: string): string {
    const connection = this.connectionModel.connection;
    const slug = this.connectionModel.cluster.slug;
    switch (slug) {
      case "mainnet-beta":
        return `https://explorer.solana.com/address/${key}`;
      case "custom":
        const clusterUrl = encodeURIComponent(connection.rpcEndpoint);
        return `https://explorer.solana.com/address/${key}?cluster=custom&customUrl=${clusterUrl}`;
      default:
        throw new Error("Invalid cluster slug for formatExplorerAccountLink");
    }
  }
}
