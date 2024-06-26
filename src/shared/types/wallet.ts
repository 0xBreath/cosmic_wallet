import { Keypair, PublicKey } from "@solana/web3.js";

export interface BaseAccount {
  keypair: Keypair;
  name: string;
  isSelected: boolean;
}

export interface DerivedAccount extends BaseAccount {
  walletIndex: number;
  derivationPath?: string;
}

export interface ImportedAccount extends BaseAccount {
  ciphertext: string;
  nonce: string;
  importedPublicKey: PublicKey;
}

export type WalletAccount = DerivedAccount | ImportedAccount;

export type WalletAccounts = {
  accounts: WalletAccount[];
  derivedAccounts: DerivedAccount[];
  importedAccounts: ImportedAccount[];
};

export type SerializableImportedAccount = {
  secretKey: string;
  name: string;
  isSelected: boolean;
  ciphertext: string;
  nonce: string;
  importedPublicKey: string;
};

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

export type Address = string;
export type Name = string;
