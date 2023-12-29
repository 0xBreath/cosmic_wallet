import { AccountMeta, PublicKey } from "@solana/web3.js";
import { Account } from "@solana/spl-token";

export type ParsedTokenBalance = {
  /** Decimal adjusted balance */
  uiAmount: number | null;

  /** The token account for this balance */
  tokenAccount: string;

  /** The SPL token mint */
  mint: string;

  /** The account which owns this token account */
  owner: string;
};

export type ParsedKeyedAccount = {
  publicKey: PublicKey;
  parsed: Account;
};

export type InstructionInfo = {
  type: string;
  data: AccountMeta[];
  rawData?: any;
  programId?: PublicKey;
};

export type TokenTransferInfo = {
  mintOrSol: string | "sol";
  accountBalance: number;
};
