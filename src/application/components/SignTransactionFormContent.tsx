import React from "react";
import { useEffect, useState } from "react";
import bs58 from "bs58";
import {
  Box,
  CardContent,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { decodeMessage, InstructionInfo } from "../../shared";
import UnknownInstruction from "./instructions/UnknownInstruction";
import SystemInstruction from "../components/instructions/SystemInstruction";
import TokenInstruction from "../components/instructions/TokenInstruction";
import { ConnectionModel } from "../../core";
import { CosmicWallet } from "../../wallet";
import { PublicKey } from "@solana/web3.js";

export function SignTransactionFormContent({
  origin,
  messages,
  onApprove,
  autoApprove,
  buttonRef,
}: {
  origin: string;
  messages: Buffer[];
  onApprove: () => void;
  autoApprove: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
}): React.JSX.Element {
  const connection = ConnectionModel.instance.connection;
  const wallet = CosmicWallet.instance;
  const publicKeys = wallet.tokenAccounts;

  const [parsing, setParsing] = useState(true);
  // An array of arrays, where each element is the set of instructions for a
  // single transaction.
  const [txInstructions, setTxInstructions] = useState<any[] | null>(null);

  const isMultiTx = messages.length > 1;

  useEffect(() => {
    Promise.all(messages.map((m) => decodeMessage(connection, wallet, m))).then(
      (txInstructions: any[] | undefined) => {
        setTxInstructions(txInstructions ?? null);
        setParsing(false);
      },
    );
  }, [messages, connection, wallet]);

  useEffect(() => {
    // brings window to front when we receive new instructions
    // this needs to be executed from wallet instead of adapter
    // to ensure chrome brings window to front
    window.focus();

    // Scroll to approve button and focus it to enable approve with enter.
    // Keep currentButtonRef in local variable, so the reference can't become
    // invalid until the timeout is over. this was happening to all
    // auto-approvals for unknown reasons.
    let currentButtonRef = buttonRef.current;
    if (currentButtonRef) {
      currentButtonRef.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => currentButtonRef?.focus(), 50);
    }
  }, [buttonRef]);

  const onOpenAddress = (address: PublicKey) => {
    const link = ConnectionModel.instance.formatAccountLink(address.toString());
    window.open(link, "_blank");
  };

  const getContent = (instruction: InstructionInfo) => {
    switch (instruction?.type) {
      case "closeAccount":
      case "initializeAccount":
      case "transfer":
      case "approve":
      case "revoke":
      case "mintTo":
        return (
          <TokenInstruction
            instruction={instruction}
            onOpenAddress={onOpenAddress}
          />
        );
      case "systemCreateWithSeed":
      case "systemCreate":
      case "systemTransfer":
        return (
          <SystemInstruction
            instruction={instruction}
            onOpenAddress={onOpenAddress}
          />
        );
      default:
        return (
          <UnknownInstruction
            instruction={instruction}
            onOpenAddress={onOpenAddress}
          />
        );
    }
  };

  const txLabel = (idx: number) => {
    return (
      <>
        <Typography variant="h6" gutterBottom>
          Transaction {idx.toString()}
        </Typography>
        <Divider style={{ marginTop: 20 }} />
      </>
    );
  };

  const txListItem = (
    instructions: InstructionInfo[],
    txIdx: number,
  ): React.JSX.Element | React.JSX.Element[] => {
    const ixs = instructions.map((instruction, i) => (
      <Box style={{ marginTop: 20 }} key={i}>
        {getContent(instruction)}
        <Divider style={{ marginTop: 20 }} />
      </Box>
    ));

    if (!isMultiTx) {
      return ixs;
    }

    return (
      <Box style={{ marginTop: 20 }} key={txIdx}>
        {txLabel(txIdx)}
        {ixs}
      </Box>
    );
  };

  return (
    <CardContent>
      {parsing ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              marginBottom: 20,
            }}
          >
            <CircularProgress style={{ marginRight: 20 }} />
            <Typography
              variant="subtitle1"
              style={{ fontWeight: "bold" }}
              gutterBottom
            >
              Parsing transaction{isMultiTx === true ? "s" : ""}:
            </Typography>
          </div>
          {messages.map((message, idx) => (
            <Typography key={idx} style={{ wordBreak: "break-all" }}>
              {bs58.encode(message)}
            </Typography>
          ))}
        </>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            {txInstructions
              ? `${origin} wants to:`
              : `Unknown transaction data`}
          </Typography>
          {txInstructions ? (
            txInstructions.map((instructions, txIdx) => {
              return txListItem(instructions, txIdx);
            })
          ) : (
            <>
              <Typography
                variant="subtitle1"
                style={{ fontWeight: "bold" }}
                gutterBottom
              >
                Unknown transaction{isMultiTx === true ? "s" : ""}:
              </Typography>
              {messages.map((message) => (
                <Typography style={{ wordBreak: "break-all" }}>
                  {bs58.encode(message)}
                </Typography>
              ))}
            </>
          )}
        </>
      )}
    </CardContent>
  );
}
