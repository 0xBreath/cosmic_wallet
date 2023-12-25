import React from "react";
import { Typography } from "@mui/material";
import { LabelValue } from "..";
import { InstructionInfo } from "../../../shared";
import { PublicKey } from "@solana/web3.js";
import { CosmicWallet } from "../../../wallet";

const TYPE_LABELS: Record<string, string> = {
  initializeMint: "Initialize mint",
  initializeAccount: "Initialize account",
  transfer: "Transfer",
  approve: "Approve",
  revoke: "Revoke",
  mintTo: "Mint to",
  closeAccount: "Close account",
};

const DATA_LABELS: Record<
  string,
  { label: string; address: boolean; transform?: any }
> = {
  amount: {
    label: "Amount",
    address: false,
    transform: (amount: number) => amount.toString(),
  },
  authorityType: { label: "Authority type", address: false },
  currentAuthority: { label: "Current authority", address: true },
  decimals: { label: "Decimals", address: false },
  delegate: { label: "Delegate", address: true },
  destination: { label: "Destination", address: true },
  mint: { label: "Mint", address: true },
  mintAuthority: { label: "Mint authority", address: true },
  newAuthority: { label: "New authority", address: true },
  owner: { label: "Owner", address: true },
  source: { label: "Source", address: true },
};

export default function TokenInstruction({
  instruction,
  onOpenAddress,
}: {
  instruction: InstructionInfo;
  onOpenAddress: (address: PublicKey) => void;
}) {
  const wallet = CosmicWallet.instance;
  const publicKeys = wallet.tokenAccounts.map((t) => t.address);
  const { type, data } = instruction;

  const getAddressValue = (address: PublicKey) => {
    const isOwned = publicKeys.some((ownedKey) => ownedKey.equals(address));
    const isOwner = wallet.publicKey?.equals(address);
    return isOwner
      ? "This wallet"
      : (isOwned ? "(Owned) " : "") + address?.toString();
  };

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
          const { label, address, transform } = dataLabel;
          return (
            <LabelValue
              key={key}
              label={label + ""}
              value={
                address
                  ? getAddressValue(value.pubkey)
                  : transform
                    ? transform(value)
                    : value
              }
              link={address}
              onClick={() => address && onOpenAddress(value.pubkey)}
            />
          );
        })}
    </>
  );
}
