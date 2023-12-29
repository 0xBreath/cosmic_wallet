import { Keypair, PublicKey } from "@solana/web3.js";

export interface WalletSelector {
  walletIndex?: number;
  importedPubkey?: PublicKey;
  derivationPath?: string;
  account?: Keypair;
  change?: any;
}

export const DEFAULT_WALLET_SELECTOR: WalletSelector = {
  walletIndex: 0,
  importedPubkey: undefined,
};

export interface PrivateKeyImport {
  name: string;
  ciphertext: string;
  nonce: string;
}

export type WalletAccounts = {
  accounts: WalletAccountData[];
  derivedAccounts: WalletAccountData[];
  importedAccounts: WalletAccountData[];
};

export interface WalletAccountData {
  selector: WalletSelector;
  address: PublicKey;
  name: string;
  isSelected: boolean;
}

export interface CosmicWalletState {
  seed?: string;
  mnemonic?: string;
  importsEncryptionKey?: string;
  setWalletSelector: any;
  privateKeyImports: Record<string, PrivateKeyImport>;
  setPrivateKeyImports: any;
  accounts: any;
  derivedAccounts: WalletAccountData[];
  addAccount: any;
  setAccountName: any;
  derivationPath: string;
}

export type MnemonicAndSeed = {
  mnemonic?: string;
  seed?: string;
  importsEncryptionKey?: Buffer;
  derivationPath?: string;
};

export type UnlockedMnemonicAndSeed = {
  unlockedMnemonic: MnemonicAndSeed;
  loading: boolean;
};

export type LockedMnemonicAndSeed = {
  hasLockedMnemonic: boolean;
  loading: boolean;
};

export enum RefreshState {
  Pending = "pending",
  Ready = "ready",
}
