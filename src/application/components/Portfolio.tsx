import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { CosmicWallet } from "../../wallet";
import { Typography } from "@mui/material";
import { WalletSeedModel } from "../../core";

export const Portfolio = observer(() => {
  const cosmicWallet = CosmicWallet.instance;
  const seedModel = WalletSeedModel.instance;

  const [seed, setSeed] = useState<string | null>(null);
  useEffect(() => {
    if (
      seedModel.unlockedMnemonicAndSeed &&
      seedModel.unlockedMnemonicAndSeed.unlockedMnemonic.seed
    ) {
      setSeed(seedModel.unlockedMnemonicAndSeed.unlockedMnemonic.seed);
    }
  }, [seedModel.unlockedMnemonicAndSeed]);

  return (
    <>
      {/*{seed && <Typography variant="body1">Seed: {`${Buffer.from(seed, "hex")}`}</Typography>}*/}
      <Typography variant="body1">{cosmicWallet.solanaBalance} SOL</Typography>
      <Typography variant="h3">Token Accounts</Typography>
      {[...cosmicWallet.tokenAccounts.values()].map((value) => (
        <>
          <Typography variant="body1" key={value.address.toString()}>
            {`${value.mint.toString()}: ${value.amount}`}
          </Typography>
        </>
      ))}
      <Typography variant="h3">Token Balances</Typography>
      {[...cosmicWallet.tokenBalances.entries()].map(([key, value]) => (
        <>
          <Typography variant="body1" key={key}>
            {`${key}: ${value}`}
          </Typography>
        </>
      ))}
    </>
  );
});
