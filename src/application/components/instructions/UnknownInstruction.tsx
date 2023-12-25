import React from "react";
import { LabelValue } from "..";
import { Typography } from "@mui/material";
import { PublicKey } from "@solana/web3.js";
import { InstructionInfo } from "../../../shared";

export default function UnknownInstruction({
  instruction,
  onOpenAddress,
}: {
  instruction: InstructionInfo;
  onOpenAddress: (address: PublicKey) => void;
}) {
  return (
    <>
      <Typography
        variant="subtitle1"
        style={{ fontWeight: "bold" }}
        gutterBottom
      >
        Unknown instruction:
      </Typography>
      <LabelValue
        key="Program"
        label="Program"
        value={instruction.programId?.toString() || "Unknown"}
        link={true}
        gutterBottom={true}
        onClick={() => {
          if (instruction.programId) {
            onOpenAddress(instruction.programId);
          }
        }}
      />
      {instruction.data &&
        instruction.data.map((accountMeta, index) => {
          return (
            <>
              <LabelValue
                key={index + ""}
                label={"Account #" + (index + 1)}
                value={accountMeta.pubkey.toString()}
                link={true}
                onClick={() => onOpenAddress(accountMeta.pubkey)}
              />
              <Typography gutterBottom>
                Writable: {accountMeta.isWritable.toString()}
              </Typography>
            </>
          );
        })}
      <Typography style={{ wordBreak: "break-all" }}>
        Data: {instruction.rawData}
      </Typography>
    </>
  );
}
