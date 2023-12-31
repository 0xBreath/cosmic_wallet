import React from "react";
import { IconButton, styled, Typography } from "@mui/material";
import { copyToClipboard, shortenAddress } from "../../shared";
import { ContentCopyOutlined } from "@mui/icons-material";
import { observer } from "mobx-react";
import { CosmicWallet } from "../../wallet";

export const AddressDisplay = observer(() => {
  const cosmicWallet = CosmicWallet.instance;

  const account = cosmicWallet.walletAccount;
  if (!account || !account.name || !account.keypair) {
    return null;
  }

  return (
    <Container>
      <PublicKeyWrapper>
        <Typography variant="h3">{account.name}</Typography>
        <Typography variant="body1" color="textSecondary">
          {shortenAddress(account.keypair.publicKey.toString())}
        </Typography>
      </PublicKeyWrapper>
      <IconButton
        onClick={() => {
          account.keypair &&
            copyToClipboard(account.keypair.publicKey.toString());
        }}
      >
        <ContentCopyOutlined fontSize="small" />
      </IconButton>
    </Container>
  );
});

const Container = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingLeft: "10px",
  paddingRight: "10px",
}));

const PublicKeyWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));
