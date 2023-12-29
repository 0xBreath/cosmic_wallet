import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { CosmicWallet } from "../../wallet";
import { Typography } from "@mui/material";
import { WalletSeedModel } from "../../core";

export const Portfolio = observer(() => {
  const cosmicWallet = CosmicWallet.instance;

  return (
    <>
      <Typography variant="body1">{cosmicWallet.solanaBalance} SOL</Typography>
      <Typography variant="h3">Token Balances</Typography>
      {[...cosmicWallet.tokenBalances.values()].map((value) => (
        <>
          <Typography variant="body1" key={value.mint}>
            {`${value.mint}: ${value.uiAmount ?? 0}`}
          </Typography>
        </>
      ))}
    </>
  );
});
