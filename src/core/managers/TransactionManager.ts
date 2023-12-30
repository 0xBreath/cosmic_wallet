import bs58 from "bs58";
import {
  AccountInfo,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionSignature,
} from "@solana/web3.js";
import { ConnectionManager, PlayerProfileService } from "..";
import { makeAutoObservable } from "mobx";
import {
  AsyncSigner,
  buildAndSignTransaction,
  buildDynamicTransactions,
  InstructionReturn,
  sendTransaction,
  transfer,
  createAssociatedTokenAccountIdempotent,
} from "@staratlas/data-source";
import { SupportedTransactionVersions } from "@solana/wallet-adapter-base/src/transaction";
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  Mint,
  unpackMint,
} from "@solana/spl-token";
import { Buffer } from "buffer";

export class TransactionManager {
  private static _instance: TransactionManager;
  static get instance(): TransactionManager {
    if (!this._instance) {
      this._instance = new TransactionManager();
    }
    return this._instance;
  }

  /// Models
  protected connectionModel = ConnectionManager.instance;

  /// Services
  protected playerProfileService = PlayerProfileService.instance;

  /// Transaction management
  supportedTransactionVersions: SupportedTransactionVersions = new Set([
    "legacy",
  ]);
  protected data: {
    skipPreflightConfig: boolean;
  } = { skipPreflightConfig: process.env.USE_SKIP_PREFLIGHT === "true" };

  constructor() {
    makeAutoObservable(this);

    // Transaction builders
    this.nativeTransfer = this.nativeTransfer.bind(this);
    this.tokenTransfer = this.tokenTransfer.bind(this);
    this.mintAccount = this.mintAccount.bind(this);

    // Transaction handlers
    this.sendTransaction = this.sendTransaction.bind(this);
    this.sendDynamicTransaction = this.sendDynamicTransaction.bind(this);
  }

  /*
   *
   * Transaction builders
   *
   */

  async nativeTransfer(
    signer: AsyncSigner,
    destination: PublicKey,
    amount: number,
  ): Promise<void> {
    const ix: InstructionReturn = transfer(
      signer,
      destination,
      amount * LAMPORTS_PER_SOL,
    );
    const sigs = await this.sendTransaction(signer, ix);
    for (const sig in sigs) {
      console.log(
        "native transfer:",
        this.connectionModel.formatTransactionLink(sig),
      );
    }
    // todo: push to transaction history
    // todo: toast notification
  }

  async tokenTransfer(
    signer: AsyncSigner,
    mint: PublicKey,
    destination: PublicKey,
    amount: number,
  ): Promise<void> {
    const mintInfo = await this.mintAccount(mint);

    const fromAta = getAssociatedTokenAddressSync(mint, signer.publicKey());

    const toAta: { address; instructions } =
      createAssociatedTokenAccountIdempotent(mint, destination);

    const transferIxs: InstructionReturn = async (funder) => ({
      instruction: createTransferCheckedInstruction(
        fromAta, // from (should be a token account)
        mint, // mint
        toAta.address, // to (should be a token account)
        signer.publicKey(), // from's owner
        amount * 10 ** mintInfo.decimals, // amount, if your decimals is 8, send 10^8 for 1 token
        mintInfo.decimals, // todo: find a way to get this, for now assume 8
      ),
      signers: [signer],
    });

    const ixs = [toAta.instructions, transferIxs];
    const sigs = await this.sendTransaction(signer, ixs);
    for (const sig in sigs) {
      console.log(
        "token transfer:",
        this.connectionModel.formatTransactionLink(sig),
      );
    }
  }

  async mintAccount(mint: PublicKey): Promise<Mint> {
    const mintInfo: AccountInfo<Buffer> =
      await ConnectionManager.instance.connection.getAccountInfo(mint);
    return unpackMint(mint, mintInfo);
  }

  /*
   *
   * Manage building, signing, and sending transactions
   *
   */

  async sendTransaction(
    signer: AsyncSigner,
    instructions: InstructionReturn | InstructionReturn[],
  ): Promise<TransactionSignature[] | null> {
    const transaction = await buildAndSignTransaction(instructions, signer, {
      connection: this.connectionModel.connection,
    });

    this.connectionModel.logTransactionResult(transaction.transaction);

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

    return [sigOrErr.value];
  }

  /**
   * This method should be used to sign + send an arbitrary amount of instructions with one button click.
   * Packs as many instructions into each transaction as possible, so use this for efficiency.
   * This does not provide functionality to define which instructions go into which transactions.
   * To send each instruction individually, see `sendInstructionsSeparately`.
   */
  async sendDynamicTransaction(
    signer: AsyncSigner,
    instructions: InstructionReturn[],
  ): Promise<TransactionSignature[] | null> {
    if (!signer || !this.playerProfileService.anchorProgram) return null;

    try {
      const result = await buildDynamicTransactions(instructions, signer, {
        connection: this.connectionModel.connection,
      });

      if (!result.isOk()) {
        console.error("Transaction error", JSON.stringify(result, null, 2));
        return null;
      }

      for (const transaction of result.value) {
        this.connectionModel.logTransactionResult(transaction.transaction);

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

      return result.value
        .map((tx) => tx.transaction.signature)
        .filter((sig): sig is Buffer => !!sig)
        .map((sig) => bs58.encode(sig));
    } catch (err) {
      console.debug("Failed to build transactions", err);
      return null;
    }
  }
}
