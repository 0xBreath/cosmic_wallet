import React from "react";
import { IconButton, styled, Typography } from "@mui/material";
import { copyToClipboard, shortenAddress } from "../../shared";
import { ContentCopyOutlined } from "@mui/icons-material";
import { observer } from "mobx-react";
import { CosmicWallet } from "../../wallet";

export const AddressDisplay = observer(() => {
  const cosmicWallet = CosmicWallet.instance;

  if (!cosmicWallet.walletAccount || !cosmicWallet.walletAccount.name) {
    return null;
  }

  return (
    <Container>
      <PublicKeyWrapper>
        <Typography variant="h3">{cosmicWallet.walletAccount.name}</Typography>
        <Typography variant="body1" color="textSecondary">
          {shortenAddress(cosmicWallet.walletAccount.address.toString())}
        </Typography>
      </PublicKeyWrapper>
      <IconButton
        onClick={() =>
          copyToClipboard(cosmicWallet.walletAccount.address.toString())
        }
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
