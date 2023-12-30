import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  getParsedTokenBalancesForKey,
  ParsedTokenBalance,
  RefreshState,
} from "../../shared";
import { makeAutoObservable, observable, runInAction } from "mobx";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { setIntervalAsync } from "set-interval-async/dynamic";
import { ConnectionManager } from "./ConnectionManager";

/*
 * Fetch and cache token balances
 */
export class TokenManager {
  /// Token balance management
  protected _solanaBalanceInLamports = 0;
  protected _tokenBalances: Map<string, ParsedTokenBalance> = observable.map(
    new Map(),
  );
  /// Reactions
  protected _asyncPolls: any[] = [];

  /// Managers
  protected connectionManager = ConnectionManager.instance;

  /// State
  publicKey: PublicKey | null = null;
  refreshTokenState = RefreshState.Ready;

  constructor(key: PublicKey | null) {
    makeAutoObservable(this);
    this.publicKey = key;
    // Fetch and cache token balances
    this.refreshEverything = this.refreshEverything.bind(this);
    this.refreshSolanaBalance = this.refreshSolanaBalance.bind(this);
    this.refreshTokenBalances = this.refreshTokenBalances.bind(this);
    this.refreshBalanceForMint = this.refreshBalanceForMint.bind(this);

    this.refreshEverything();

    // TODO: Convert to RPC program/account subscriptions instead of polling
    this._asyncPolls.push(
      setIntervalAsync(async () => {
        await this.refreshEverything();
      }, 1000 * 60),
    );
  }

  async refreshEverything(): Promise<void> {
    await this.refreshSolanaBalance();
    await this.refreshTokenBalances();
  }

  get solanaBalance(): number {
    return Number(
      (this._solanaBalanceInLamports / LAMPORTS_PER_SOL).toFixed(2),
    );
  }

  async refreshSolanaBalance(): Promise<void> {
    if (!this.publicKey) return;
    this._solanaBalanceInLamports =
      await this.connectionManager.connection.getBalance(this.publicKey);
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
}
