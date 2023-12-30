import { InstructionInfo, ParsedTokenBalance } from "../types";
import {
  Account,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
  unpackAccount,
} from "@solana/spl-token";
import {
  AccountInfo,
  AccountMeta,
  CompiledInstruction,
  Connection,
  KeyedAccountInfo,
  Message,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { CosmicWallet } from "../../wallet";
import bs58 from "bs58";
import { decodeTokenInstruction } from "@project-serum/token";

export const getParsedTokenBalancesForKey = async (
  connection: Connection,
  key: PublicKey,
): Promise<ParsedTokenBalance[]> => {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(key, {
    programId: TOKEN_PROGRAM_ID,
  });
  const result: ParsedTokenBalance[] = [];
  for (const tokenAccount of tokenAccounts.value) {
    const accountKey = tokenAccount.pubkey.toBase58();
    const { info } = tokenAccount.account.data.parsed;
    result.push({
      // amount: new BN(info.tokenAmount.amount),
      uiAmount: info.tokenAmount.uiAmount,
      tokenAccount: accountKey,
      mint: info.mint,
      owner: key.toString(),
      // decimals: info.tokenAmount.decimals,
    });
  }
  return result;
};

export const getParsedTokenAccountInfo = async (
  connection: Connection,
  key: PublicKey,
  programId = TOKEN_PROGRAM_ID,
): Promise<Account | null> => {
  const res: AccountInfo<Buffer> | null = await connection.getAccountInfo(key);
  return unpackAccount(key, res, programId);
};

export const getRawAccountsByOwner = async (
  connection: Connection,
  owner: PublicKey,
  programId = TOKEN_PROGRAM_ID,
): Promise<KeyedAccountInfo[]> => {
  const res = (
    await connection.getTokenAccountsByOwner(owner, {
      programId,
    })
  ).value;
  const infos: KeyedAccountInfo[] = res.map((data) => {
    const info: KeyedAccountInfo = {
      accountId: data.pubkey,
      accountInfo: data.account,
    };
    return info;
  });
  return infos;
};

export const parseTokenAccountData = (
  key: PublicKey,
  data: AccountInfo<Buffer>,
): Account => {
  return unpackAccount(key, data, TOKEN_PROGRAM_ID);
};

export async function confirmTransaction(
  connection: Connection,
  signature: string,
) {
  let startTime = new Date();
  let result = await connection.confirmTransaction(signature, "recent");
  if (result.value.err) {
    throw new Error(
      "Error confirming transaction: " + JSON.stringify(result.value.err),
    );
  }
  console.log(
    "Transaction confirmed after %sms",
    new Date().getTime() - startTime.getTime(),
  );
  return result.value;
}

export const decodeMessage = async (
  connection: Connection,
  wallet: CosmicWallet,
  message: Buffer,
): Promise<InstructionInfo[] | undefined> => {
  // get message object
  const transactionMessage: Message = Message.from(message);
  if (!transactionMessage?.instructions || !transactionMessage?.accountKeys) {
    return;
  }

  // get owned keys (used for security checks)
  const publicKey: PublicKey | null = wallet.publicKey;

  // get instructions
  const instructions: any[] = [];
  for (var i = 0; i < transactionMessage.instructions.length; i++) {
    let transactionInstruction: CompiledInstruction =
      transactionMessage.instructions[i];
    const instruction = await toInstruction(
      connection,
      publicKey,
      transactionMessage?.accountKeys,
      transactionInstruction,
      transactionMessage,
      i,
    );
    instructions.push({
      ...instruction,
      rawData: transactionInstruction?.data,
    });
  }
  return instructions;
};

const toInstruction = async (
  connection: Connection,
  publicKey: PublicKey | null,
  accountKeys: PublicKey[],
  instruction: CompiledInstruction,
  transactionMessage: Message,
  index: number,
): Promise<InstructionInfo | undefined> => {
  if (
    !publicKey ||
    instruction?.data == null ||
    !instruction?.accounts ||
    !instruction?.programIdIndex
  ) {
    return;
  }

  // get instruction data
  const decoded = bs58.decode(instruction.data);

  const programId = getAccountByIndex(
    [instruction.programIdIndex],
    accountKeys,
    0,
  );
  if (!programId) {
    return;
  }

  try {
    if (programId.equals(SystemProgram.programId)) {
      console.log("[" + index + "] Handled as system instruction");
      return handleSystemInstruction(publicKey, instruction, accountKeys);
    } else if (programId.equals(TOKEN_PROGRAM_ID)) {
      console.log("[" + index + "] Handled as token instruction");
      return handleTokenInstruction(publicKey, instruction, accountKeys);
    } else {
      return {
        type: "Unknown",
        data: instruction.accounts.map((index) => ({
          pubkey: accountKeys[index],
          isWritable: transactionMessage.isAccountWritable(index),
          isSigner: transactionMessage.isAccountSigner(index),
        })),
        programId,
      };
    }
  } catch (e) {
    console.log(`Failed to decode instruction: ${e}`);
  }

  // all decodings failed
  console.log("[" + index + "] Failed, data: " + JSON.stringify(decoded));

  return;
};

const getAccountByIndex = (
  accounts: number[],
  accountKeys: PublicKey[],
  accountIndex: number,
) => {
  const index = accounts.length > accountIndex && accounts[accountIndex];
  return accountKeys?.length > index && accountKeys[index as number];
};

const handleTokenInstruction = (
  publicKey: PublicKey,
  instruction: CompiledInstruction,
  accountKeys: PublicKey[],
): { type: string; data: any } | undefined => {
  const { programIdIndex, accounts, data } = instruction;
  if (!programIdIndex || !accounts || !data) {
    return;
  }

  const keys: AccountMeta[] = accounts.map((accountIndex) => {
    const pubkey = accountKeys[accountIndex];
    return {
      pubkey,
      isSigner: publicKey.equals(pubkey),
      isWritable: true,
    };
  });
  // construct token instruction
  const tokenInstruction: TransactionInstruction = {
    programId: accountKeys[programIdIndex],
    keys,
    data: bs58.decode(data) as Buffer,
  };

  let decoded = decodeTokenInstruction(tokenInstruction);

  return {
    type: decoded.type,
    data: decoded.params,
  };
};

const handleSystemInstruction = (
  publicKey: PublicKey,
  instruction: CompiledInstruction,
  accountKeys: PublicKey[],
): InstructionInfo | undefined => {
  const { programIdIndex, accounts, data } = instruction;
  if (!programIdIndex || !accounts || !data) {
    return;
  }

  // construct system instruction
  const keys: AccountMeta[] = accounts.map((accountIndex) => {
    const pubkey = accountKeys[accountIndex];
    return {
      pubkey,
      isSigner: publicKey.equals(pubkey),
      isWritable: true,
    };
  });
  const systemInstruction: TransactionInstruction = {
    programId: accountKeys[programIdIndex],
    keys,
    data: bs58.decode(data) as Buffer,
  };

  // get layout
  let decoded: any;
  const type = SystemInstruction.decodeInstructionType(systemInstruction);
  switch (type) {
    case "Create":
      decoded = SystemInstruction.decodeCreateAccount(systemInstruction);
      break;
    case "CreateWithSeed":
      decoded = SystemInstruction.decodeCreateWithSeed(systemInstruction);
      break;
    case "Allocate":
      decoded = SystemInstruction.decodeAllocate(systemInstruction);
      break;
    case "AllocateWithSeed":
      decoded = SystemInstruction.decodeAllocateWithSeed(systemInstruction);
      break;
    case "Assign":
      decoded = SystemInstruction.decodeAssign(systemInstruction);
      break;
    case "AssignWithSeed":
      decoded = SystemInstruction.decodeAssignWithSeed(systemInstruction);
      break;
    case "Transfer":
      decoded = SystemInstruction.decodeTransfer(systemInstruction);
      break;
    case "AdvanceNonceAccount":
      decoded = SystemInstruction.decodeNonceAdvance(systemInstruction);
      break;
    case "WithdrawNonceAccount":
      decoded = SystemInstruction.decodeNonceWithdraw(systemInstruction);
      break;
    case "InitializeNonceAccount":
      decoded = SystemInstruction.decodeNonceInitialize(systemInstruction);
      break;
    case "AuthorizeNonceAccount":
      decoded = SystemInstruction.decodeNonceAuthorize(systemInstruction);
      break;
    default:
      return;
  }

  if (
    !decoded ||
    (decoded.fromPubkey && !publicKey.equals(decoded.fromPubkey))
  ) {
    return;
  }

  return {
    type: "system" + type,
    data: decoded,
  };
};
