import assert from "assert";
import { CacheKeyProps, CacheListener } from "../../shared";
import { action, makeAutoObservable, observable } from "mobx";
import { AccountInfo, Connection, PublicKey } from "@solana/web3.js";
import { ConnectionModel } from "./ConnectionModel";
import { useAsyncData, useRefEqual } from "../../application";
import { useEffect } from "react";

/// GlobalLoops
export class CacheModel {
  PageLoadTime = new Date();
  /// Contains result of all functions
  GlobalCache: Map<string, any> = new Map();
  ErrorCache: Map<string, any> = new Map();
  protected loops: Map<string, FetchLoopInternal> = new Map();

  constructor() {
    makeAutoObservable(this, {
      PageLoadTime: observable,
      GlobalCache: observable,
      ErrorCache: observable,

      addListener: action,
      removeListener: action,
      refresh: action,
      refreshAll: action,
      refreshCache: action,
      setCache: action,
      accountInfo: action,
      refreshAccountInfo: action,
      setInitialAccountInfo: action,
    });

    this.addListener = this.addListener.bind(this);
    this.removeListener = this.removeListener.bind(this);
    this.refresh = this.refresh.bind(this);
    this.refreshAll = this.refreshAll.bind(this);
    this.refreshCache = this.refreshCache.bind(this);
    this.setCache = this.setCache.bind(this);
    this.accountInfo = this.accountInfo.bind(this);
    this.refreshAccountInfo = this.refreshAccountInfo.bind(this);
    this.setInitialAccountInfo = this.setInitialAccountInfo.bind(this);
  }

  private static _instance: CacheModel;
  static get instance(): CacheModel {
    if (!this._instance) {
      this._instance = new CacheModel();
    }
    return this._instance;
  }

  addListener<T>(listener: CacheListener<T>) {
    if (!this.loops.has(listener.cacheKey)) {
      this.loops.set(
        listener.cacheKey,
        new FetchLoopInternal(listener.cacheKey, listener.fn),
      );
    }
    this.loops.get(listener.cacheKey)?.addListener(listener);
  }

  removeListener<T>(listener: CacheListener<T>) {
    let loop = this.loops.get(listener.cacheKey);
    loop?.removeListener(listener);
    if (loop?.stopped) {
      this.loops.delete(listener.cacheKey);
    }
  }

  refresh(cacheKey: string) {
    if (this.loops.has(cacheKey)) {
      this.loops.get(cacheKey)?.refresh();
    }
  }

  refreshAll() {
    return Promise.all([...this.loops.values()].map((loop) => loop.refresh()));
  }

  public refreshCache(cacheKeyProps: CacheKeyProps, clearCache = false): void {
    const cacheKey = JSON.stringify(cacheKeyProps);
    if (clearCache) {
      this.GlobalCache.delete(cacheKey);
    }
    const loop = this.loops.get(cacheKey);
    if (loop) {
      loop.refresh();
      if (clearCache) {
        loop.notifyListeners();
      }
    }
  }

  public setCache(
    cacheKeyProps: CacheKeyProps,
    value: any,
    { initializeOnly = false } = {},
  ): void {
    const cacheKey = JSON.stringify(cacheKeyProps);
    if (initializeOnly && this.GlobalCache.has(cacheKey)) {
      return;
    }
    this.GlobalCache.set(cacheKey, value);
    const loop = this.loops.get(cacheKey);
    if (loop) {
      loop.notifyListeners();
    }
  }

  /// Alias for [`useAccountInfo`]
  public accountInfo(
    publicKey?: PublicKey,
  ): [AccountInfo<Buffer> | null | undefined, boolean] {
    const connection = ConnectionModel.instance.connection;

    const cacheKeyProps: CacheKeyProps = {
      rpcEndpoint: connection.rpcEndpoint,
      publicKey: publicKey?.toString() ?? "",
    };
    const { data: accountInfo, loaded } =
      useAsyncData<AccountInfo<Buffer> | null>(
        async () => (publicKey ? connection.getAccountInfo(publicKey) : null),
        cacheKeyProps,
      );
    useEffect(() => {
      if (!publicKey) {
        return;
      }
      let previousInfo: AccountInfo<Buffer> | null = null;
      const id = connection.onAccountChange(publicKey, (info) => {
        if (
          !previousInfo ||
          !previousInfo.data.equals(info.data) ||
          previousInfo.lamports !== info.lamports
        ) {
          previousInfo = info;
          this.setCache(cacheKeyProps, info);
        }
      });
      return () => {
        connection.removeAccountChangeListener(id);
      };
    }, [connection, publicKey?.toBase58() ?? "", cacheKeyProps]);
    return [
      useRefEqual(
        accountInfo,
        (oldInfo, newInfo) =>
          !!oldInfo &&
          !!newInfo &&
          oldInfo.data.equals(newInfo.data) &&
          oldInfo.lamports === newInfo.lamports,
      ),
      loaded,
    ];
  }

  public refreshAccountInfo(
    connection: Connection,
    publicKey: PublicKey,
    clearCache = false,
  ) {
    const cacheKeyProps: CacheKeyProps = {
      rpcEndpoint: connection.rpcEndpoint,
      publicKey: publicKey.toString(),
    };
    this.refreshCache(cacheKeyProps, clearCache);
  }

  public setInitialAccountInfo(
    connection: Connection,
    publicKey: PublicKey,
    accountInfo: AccountInfo<Buffer>,
  ) {
    const cacheKeyProps: CacheKeyProps = {
      rpcEndpoint: connection.rpcEndpoint,
      publicKey: publicKey.toString(),
    };
    this.setCache(cacheKeyProps, accountInfo, { initializeOnly: true });
  }

  /// Alias for [`useAsyncData`]
  /// Use to set listener for state.
  // Fetch updated value from [`GlobalCache`]
  addAsyncListener<T = any>(
    fn: () => Promise<T>,
    cacheKeyProps: CacheKeyProps,
    refreshInterval = 60000,
    callback: () => void,
  ): void {
    const cacheKey = JSON.stringify(cacheKeyProps);

    const listener: CacheListener<T> = {
      cacheKey,
      fn,
      refreshInterval,
      callback,
    };
    this.addListener(listener);
  }
}

class FetchLoopInternal<T = any> {
  cacheKey: any;
  fn: () => Promise<T>;
  timeoutId: null | any;
  listeners: Set<CacheListener<T>>;
  errors: number;

  protected cacheModel = CacheModel.instance;

  constructor(cacheKey: any, fn: () => Promise<T>) {
    this.cacheKey = cacheKey;
    this.fn = fn;
    this.timeoutId = null;
    this.listeners = new Set();
    this.errors = 0;
  }

  get refreshInterval(): number {
    return Math.min(
      ...[...this.listeners].map((listener) => listener.refreshInterval),
    );
  }

  get stopped(): boolean {
    return this.listeners.size === 0;
  }

  addListener(listener: CacheListener<T>): void {
    const previousRefreshInterval = this.refreshInterval;
    this.listeners.add(listener);
    if (this.refreshInterval < previousRefreshInterval) {
      this.refresh();
    }
  }

  removeListener(listener: CacheListener<T>): void {
    assert(this.listeners.delete(listener));
    if (this.stopped) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    }
  }

  notifyListeners(): void {
    this.listeners.forEach((listener) => listener.callback());
  }

  refresh = async () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.stopped) {
      return;
    }

    try {
      const data = await this.fn();
      this.cacheModel.GlobalCache.set(this.cacheKey, data);
      this.cacheModel.ErrorCache.delete(this.cacheKey);
      this.errors = 0;
      return data;
    } catch (error) {
      ++this.errors;
      this.cacheModel.GlobalCache.delete(this.cacheKey);
      this.cacheModel.ErrorCache.set(this.cacheKey, error);
      console.warn(error);
    } finally {
      this.notifyListeners();
      if (!this.timeoutId && !this.stopped) {
        let waitTime = this.refreshInterval;

        // Back off on errors.
        if (this.errors > 0) {
          waitTime = Math.min(1000 * 2 ** (this.errors - 1), 60000);
        }

        // Don't do any refreshing for the first five seconds, to make way for other things to load.
        const timeSincePageLoad = +new Date() - +this.cacheModel.PageLoadTime;
        if (timeSincePageLoad < 5000) {
          waitTime += 5000 - timeSincePageLoad / 2;
        }

        // Refresh background pages slowly.
        if (document.visibilityState === "hidden") {
          waitTime = 60000;
        } else if (!document.hasFocus()) {
          waitTime *= 1.5;
        }

        // Add jitter so we don't send all requests at the same time.
        waitTime *= 0.8 + 0.4 * Math.random();

        this.timeoutId = setTimeout(this.refresh, waitTime);
      }
    }
  };
}
