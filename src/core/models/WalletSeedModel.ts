import { BinaryLike, pbkdf2 } from "crypto";
import nacl, { randomBytes, secretbox } from "tweetnacl";
import { EventEmitter } from "events";
import {
  isExtension,
  LockedMnemonicAndSeed,
  MnemonicAndSeed,
  PrivateKeyImport,
  UnlockedMnemonicAndSeed,
} from "../../shared";
import bs58 from "bs58";
import { autorun, makeAutoObservable } from "mobx";
import { Keypair } from "@solana/web3.js";
import { derivePath } from "ed25519-hd-key";
// [HDKey](https://github.com/paulmillr/scure-bip32/blob/main/test/hdkey.test.ts#L162)
import { HDKey } from "@scure/bip32";

export class WalletSeedModel {
  private static _instance: WalletSeedModel;
  static get instance(): WalletSeedModel {
    if (!this._instance) {
      this._instance = new WalletSeedModel();
    }
    return this._instance;
  }

  /// Constants
  public static EMPTY_MNEMONIC: MnemonicAndSeed = {};
  public static DERIVATION_PATHS = {
    deprecated: undefined,
    bip44: "bip44",
    bip44Change: "bip44Change",
    bip44Root: "bip44Root", // Ledger only.
  };
  private static PRIVATE_KEY_IMPORTS_KEY = "walletPrivateKeyImports";

  /// State
  // todo: walletSeedListenerState = 0;
  currentUnlockedMnemonicAndSeed: MnemonicAndSeed | null = null;
  walletSeedChanged = new EventEmitter();
  protected _reactions: any[] = [];

  constructor() {
    makeAutoObservable(this);

    this.deriveImportsEncryptionKey =
      this.deriveImportsEncryptionKey.bind(this);
    this.normalizeMnemonic = this.normalizeMnemonic.bind(this);
    this.generateMnemonicAndSeed = this.generateMnemonicAndSeed.bind(this);
    this.mnemonicToSeed = this.mnemonicToSeed.bind(this);
    this.getUnlockedMnemonicAndSeed =
      this.getUnlockedMnemonicAndSeed.bind(this);
    this.getExtensionUnlockedMnemonic =
      this.getExtensionUnlockedMnemonic.bind(this);
    this.setUnlockedMnemonicAndSeed =
      this.setUnlockedMnemonicAndSeed.bind(this);
    this.storeMnemonicAndSeed = this.storeMnemonicAndSeed.bind(this);
    this.loadMnemonicAndSeed = this.loadMnemonicAndSeed.bind(this);
    this.deriveEncryptionKey = this.deriveEncryptionKey.bind(this);
    this.lockWallet = this.lockWallet.bind(this);
    this.forgetWallet = this.forgetWallet.bind(this);
    this.setPrivateKeyImports = this.setPrivateKeyImports.bind(this);
    this.decodeKeypair = this.decodeKeypair.bind(this);
    this.createReactions = this.createReactions.bind(this);

    this.createReactions();
    this.setPrivateKeyImports({} as Record<string, PrivateKeyImport>);
  }

  /// Just return unlocked mnemonic and seed
  protected _unlockedMnemonicAndSeed = (async (): Promise<MnemonicAndSeed> => {
    const unlockedExpiration = localStorage.getItem("unlockedExpiration");
    // Left here to clean up stored mnemonics from previous method
    if (unlockedExpiration && Number(unlockedExpiration) < Date.now()) {
      localStorage.removeItem("unlocked");
      localStorage.removeItem("unlockedExpiration");
    }
    const stored = JSON.parse(
      (await this.getExtensionUnlockedMnemonic()) ||
        sessionStorage.getItem("unlocked") ||
        localStorage.getItem("unlocked") ||
        "null",
    );
    if (stored === null) {
      return WalletSeedModel.EMPTY_MNEMONIC;
    }
    return {
      importsEncryptionKey: this.deriveImportsEncryptionKey(stored.seed),
      ...stored,
    };
  })();

  /// Alias for [`useUnlockedMnemonicAndSeed`]
  /// Functions like a hook. Returns mnemonic and seed, and a boolean indicating loading state.
  get unlockedMnemonicAndSeed(): UnlockedMnemonicAndSeed {
    return this.currentUnlockedMnemonicAndSeed
      ? {
          unlockedMnemonic: this.currentUnlockedMnemonicAndSeed,
          loading: false,
        }
      : { unlockedMnemonic: WalletSeedModel.EMPTY_MNEMONIC, loading: true };
  }

  /// Alias for [`useHasLockedMnemonicAndSeed`]
  /// Functions as a hook.
  get hasLockedMnemonicAndSeed(): LockedMnemonicAndSeed {
    const { unlockedMnemonic, loading } = this.unlockedMnemonicAndSeed;
    return {
      hasLockedMnemonic:
        !unlockedMnemonic.seed && !!localStorage.getItem("locked"),
      loading,
    };
  }

  get privateKeyImports(): Record<string, PrivateKeyImport> {
    const value: string | null = localStorage.getItem(
      WalletSeedModel.PRIVATE_KEY_IMPORTS_KEY,
    );
    if (!value) {
      throw new Error(
        "privateKeyImports should have been initialized with empty object",
      );
    }
    return JSON.parse(value);
  }

  /// Returns the 32 byte key used to encrypt imported private keys.
  deriveImportsEncryptionKey(seed: string): Buffer | undefined {
    // SLIP16 derivation path.
    // return bip32.fromSeed(Buffer.from(seed, "hex")).derivePath("m/10016'/0")
    //   .privateKey;
    const key = HDKey.fromMasterSeed(Buffer.from(seed, "hex"));
    const derivedKey = key.derive("m/10016'/0");
    return derivedKey.privateKey as Buffer;
  }

  public normalizeMnemonic(mnemonic: string): string {
    return mnemonic.trim().split(/\s+/g).join(" ");
  }

  public async generateMnemonicAndSeed(): Promise<MnemonicAndSeed> {
    const bip39 = await import("bip39");
    const mnemonic = bip39.generateMnemonic(256);
    const seed = await bip39.mnemonicToSeed(mnemonic);
    return { mnemonic, seed: Buffer.from(seed).toString("hex") };
  }

  public async mnemonicToSeed(mnemonic: string): Promise<string> {
    const bip39 = await import("bip39");
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("Invalid seed words");
    }
    const seed = await bip39.mnemonicToSeed(mnemonic);
    return Buffer.from(seed).toString("hex");
  }

  async getExtensionUnlockedMnemonic(): Promise<any> {
    if (!isExtension) {
      return null;
    }
    return new Promise((resolve) => {
      // @ts-ignore
      chrome.runtime.sendMessage(
        {
          channel: "cosmic_wallet_extension_mnemonic_channel",
          method: "get",
        },
        resolve,
      );
    });
  }

  public getUnlockedMnemonicAndSeed(): Promise<MnemonicAndSeed> {
    return this._unlockedMnemonicAndSeed;
  }

  setUnlockedMnemonicAndSeed(data: MnemonicAndSeed): void {
    this._unlockedMnemonicAndSeed = Promise.resolve(data);
    this.walletSeedChanged.emit("change", data);
  }

  public async storeMnemonicAndSeed(
    mnemonic: string,
    seed: string,
    password: string | undefined,
    derivationPath: string,
  ): Promise<void> {
    const plaintext = JSON.stringify({ mnemonic, seed, derivationPath });
    if (password) {
      const salt = randomBytes(16);
      const kdf = "pbkdf2";
      const iterations = 100000;
      const digest = "sha256";
      const key = await this.deriveEncryptionKey(
        password,
        salt,
        iterations,
        digest,
      );
      const nonce = randomBytes(secretbox.nonceLength);
      const encrypted = secretbox(Buffer.from(plaintext), nonce, key);
      localStorage.setItem(
        "locked",
        JSON.stringify({
          encrypted: bs58.encode(encrypted),
          nonce: bs58.encode(nonce),
          kdf,
          salt: bs58.encode(salt),
          iterations,
          digest,
        }),
      );
      localStorage.removeItem("unlocked");
    } else {
      localStorage.setItem("unlocked", plaintext);
      localStorage.removeItem("locked");
    }
    sessionStorage.removeItem("unlocked");
    if (isExtension) {
      await chrome.runtime.sendMessage({
        channel: "cosmic_wallet_extension_mnemonic_channel",
        method: "set",
        data: "",
      });
    }
    const importsEncryptionKey = this.deriveImportsEncryptionKey(seed);
    const mnemonicAndSeed = {
      mnemonic,
      seed,
      importsEncryptionKey,
      derivationPath,
    };
    this.setUnlockedMnemonicAndSeed(mnemonicAndSeed);
  }

  public async loadMnemonicAndSeed(
    password: string,
    stayLoggedIn: boolean,
  ): Promise<MnemonicAndSeed> {
    // todo: better handle null return from localStorage?
    const {
      encrypted: encodedEncrypted,
      nonce: encodedNonce,
      salt: encodedSalt,
      iterations,
      digest,
    } = JSON.parse(localStorage.getItem("locked") ?? "{}");
    const encrypted = bs58.decode(encodedEncrypted);
    const nonce = bs58.decode(encodedNonce);
    const salt = bs58.decode(encodedSalt);
    const key = await this.deriveEncryptionKey(
      password,
      salt,
      iterations,
      digest,
    );
    const plaintext = secretbox.open(encrypted, nonce, key);
    if (!plaintext) {
      throw new Error("Incorrect password");
    }
    const decodedPlaintext: string = Buffer.from(plaintext).toString();
    const { mnemonic, seed, derivationPath } = JSON.parse(decodedPlaintext);
    if (stayLoggedIn) {
      if (isExtension) {
        await chrome.runtime.sendMessage({
          channel: "cosmic_wallet_extension_mnemonic_channel",
          method: "set",
          data: decodedPlaintext,
        });
      } else {
        console.log("unlock wallet, stay logged in");
        sessionStorage.setItem("unlocked", decodedPlaintext);
      }
    }
    const importsEncryptionKey = this.deriveImportsEncryptionKey(seed);
    const mnemonicAndSeed: MnemonicAndSeed = {
      mnemonic,
      seed,
      importsEncryptionKey,
      derivationPath,
    };

    console.log("unlock wallet");
    this.setUnlockedMnemonicAndSeed(mnemonicAndSeed);
    return { mnemonic, seed, derivationPath };
  }

  async deriveEncryptionKey(
    password: BinaryLike,
    salt: BinaryLike,
    iterations: number,
    digest: string,
  ): Promise<any> {
    return new Promise((resolve, reject) =>
      pbkdf2(
        password,
        salt,
        iterations,
        secretbox.keyLength,
        digest,
        (err, key) => (err ? reject(err) : resolve(key)),
      ),
    );
  }

  public lockWallet(): void {
    this.setUnlockedMnemonicAndSeed({
      mnemonic: undefined,
      seed: undefined,
      importsEncryptionKey: undefined,
      derivationPath: undefined,
    });
  }

  public async forgetWallet(): Promise<void> {
    localStorage.clear();
    sessionStorage.removeItem("unlocked");
    if (isExtension) {
      await chrome.runtime.sendMessage({
        channel: "cosmic_wallet_extension_mnemonic_channel",
        method: "set",
        data: "",
      });
    }
    this._unlockedMnemonicAndSeed = Promise.resolve({
      mnemonic: undefined,
      seed: undefined,
      importsEncryptionKey: undefined,
    });
    this.walletSeedChanged.emit("change", WalletSeedModel.EMPTY_MNEMONIC);
    if (isExtension) {
      // Must use wrapper function for window.location.reload
      chrome.storage.local.clear(() => window.location.reload());
    } else {
      window.location.reload();
    }
  }

  public seedToKeypair(
    seed: string,
    walletIndex: number,
    derivationPath?: string,
    accountIndex = 0,
  ): Keypair {
    const derivedSeed = this.deriveSeed(
      seed,
      walletIndex,
      accountIndex,
      derivationPath,
    );
    return Keypair.fromSecretKey(
      nacl.sign.keyPair.fromSeed(derivedSeed).secretKey,
    );
  }

  /**
   * Returns an account object when given the private key
   */
  public decodeKeypair(privateKey: string): Keypair | undefined {
    try {
      return Keypair.fromSecretKey(new Uint8Array(JSON.parse(privateKey)));
    } catch (_) {
      try {
        return Keypair.fromSecretKey(new Uint8Array(bs58.decode(privateKey)));
      } catch (_) {
        return undefined;
      }
    }
  }

  public deriveKeypair(
    seed: string,
    walletIndex: number,
    derivationPath?: string,
    accountIndex = 0,
  ): Keypair {
    const derivedSeed = this.deriveSeed(
      seed,
      walletIndex,
      accountIndex,
      derivationPath,
    );
    return Keypair.fromSecretKey(
      nacl.sign.keyPair.fromSeed(derivedSeed).secretKey,
    );
  }

  deriveSeed(
    seed: string,
    walletIndex: number,
    accountIndex: number,
    derivationPath?: string,
  ): any {
    switch (derivationPath) {
      case WalletSeedModel.DERIVATION_PATHS.deprecated:
        const path = `m/501'/${walletIndex}'/0/${accountIndex}`;
        // return bip32.fromSeed(Buffer.from(seed, "hex")).derivePath(path)
        //   .privateKey;
        const key = HDKey.fromMasterSeed(Buffer.from(seed, "hex"));
        const derivedKey = key.derive(path);
        return derivedKey.privateKey as Buffer;
      case WalletSeedModel.DERIVATION_PATHS.bip44:
        const path44 = `m/44'/501'/${walletIndex}'`;
        return derivePath(path44, seed as string).key;
      case WalletSeedModel.DERIVATION_PATHS.bip44Change:
        const path44Change = `m/44'/501'/${walletIndex}'/0'`;
        return derivePath(path44Change, seed as string).key;
      default:
        throw new Error(`invalid derivation path: ${derivationPath}`);
    }
  }

  setPrivateKeyImports(value: Record<string, PrivateKeyImport> | null) {
    if (value === null) {
      localStorage.removeItem(WalletSeedModel.PRIVATE_KEY_IMPORTS_KEY);
      return;
    }
    localStorage.setItem(
      WalletSeedModel.PRIVATE_KEY_IMPORTS_KEY,
      JSON.stringify(value),
    );
  }

  private setCurrentUnlockedMnemonicAndSeed(value: MnemonicAndSeed | null) {
    this.currentUnlockedMnemonicAndSeed = value;
  }

  private createReactions() {
    this._reactions.push(
      autorun(() => {
        this.walletSeedChanged.addListener(
          "change",
          this.setCurrentUnlockedMnemonicAndSeed,
        );
        this.getUnlockedMnemonicAndSeed().then((res) => {
          this.setCurrentUnlockedMnemonicAndSeed(res);
        });
        return () => {
          this.walletSeedChanged.removeListener(
            "change",
            this.setCurrentUnlockedMnemonicAndSeed,
          );
        };
      }),
    );
  }
}
