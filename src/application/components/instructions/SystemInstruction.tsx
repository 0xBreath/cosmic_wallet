import React from "react";
import { Typography } from "@mui/material";
import { LabelValue } from "..";
import { PublicKey } from "@solana/web3.js";
import { InstructionInfo } from "../../../shared";

const TYPE_LABELS: Record<string, string> = {
  systemCreate: "Create account",
  systemCreateWithSeed: "Create account with seed",
  systemTransfer: "Transfer SOL",
};

const DATA_LABELS: Record<string, { label: string; address: boolean }> = {
  toPubkey: { label: "To", address: true },
  accountPubkey: { label: "Account", address: true },
  basePubkey: { label: "Base", address: true },
  seed: { label: "Seed", address: false },
  noncePubkey: { label: "Nonce", address: true },
  authorizedPubkey: { label: "Authorized", address: true },
  newAuthorizedPubkey: { label: "New authorized", address: true },
  newAccountPubkey: { label: "New account", address: true },
  amount: { label: "Amount", address: false },
  lamports: { label: "Lamports", address: false },
};

export default function SystemInstruction({
  instruction,
  onOpenAddress,
}: {
  instruction: InstructionInfo;
  onOpenAddress: (address: PublicKey) => void;
}) {
  const { type, data } = instruction;

  return (
    <>
      <Typography
        variant="subtitle1"
        style={{ fontWeight: "bold" }}
        gutterBottom
      >
        {TYPE_LABELS[type]}
      </Typography>
      {data &&
        Object.entries(data).map(([key, value]) => {
          const dataLabel = DATA_LABELS[key];
          if (!dataLabel) {
            return null;
          }
          const { label, address } = dataLabel;
          return (
            <LabelValue
              key={key}
              label={label + ""}
              value={address ? value?.pubkey.toString() : "Unknown Error"}
              link={address}
              onClick={() => address && onOpenAddress(value?.pubkey)}
            />
          );
        })}
    </>
  );
}
