import { PublicKey } from "@solana/web3.js";

export type CacheKeyProps = {
  rpcEndpoint: string;
  publicKey: string;
};

export interface AsyncDataResult<T> {
  data: null | undefined | T;
  loaded: boolean;
  error: any;
}

export type LocalStorageAddressInfo = {
  index: number;
  address: PublicKey;
  name: string | null;
};

export interface CacheListener<T> {
  cacheKey: string;
  fn: () => Promise<T>;
  refreshInterval: number;
  callback: () => void;
}
