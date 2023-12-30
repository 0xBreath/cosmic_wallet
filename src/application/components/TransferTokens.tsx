import React, { useState } from "react";
import { observer } from "mobx-react";
import { customTheme, TokenTransferInfo } from "../../shared";
import { Button, styled, TextField, Typography } from "@mui/material";
import { CloseOutlined, FingerprintOutlined } from "@mui/icons-material";
import { PublicKey } from "@solana/web3.js";
import { CosmicWallet } from "../../wallet";
import { AddressSelectionMenu } from "./AddressSelectionMenu";
import { KeyboardArrowDownOutlined } from "@mui/icons-material";

export const TransferTokens = observer(
  ({
    tokenInfo,
    onClose,
  }: {
    tokenInfo: TokenTransferInfo;
    onClose: () => void;
  }) => {
    const cosmicWallet = CosmicWallet.instance;
    const [amountString, setAmountString] = useState<string>("");
    const [recipient, setRecipient] = useState<string>("");
    const [anchorEl, setAnchorEl] = useState(null);

    const handleSelectAddress = (address: PublicKey) => {
      setRecipient(address.toString());
    };

    return (
      <Page>
        <HeaderRow>
          <CloseOutlined
            htmlColor={customTheme.red}
            fontSize="large"
            style={{
              position: "absolute",
              top: "0px",
              left: "5px",
            }}
            onClick={onClose}
          />
          <Typography variant="h2">Send Token</Typography>
        </HeaderRow>
        <TextFieldWrapper>
          <TextField
            type="text"
            placeholder="Amount"
            label="Amount"
            fullWidth
            variant="outlined"
            margin="normal"
            value={amountString}
            onChange={(e: any) => {
              setAmountString(e.target.value);
            }}
          />
          <TextHelperWrapper>
            <Typography variant="body1">{tokenInfo.accountBalance}</Typography>
          </TextHelperWrapper>
        </TextFieldWrapper>
        <TextFieldWrapper>
          <AddressSelectionWrapper>
            <TextField
              type="text"
              placeholder="Recipient"
              label="Recipient"
              fullWidth
              variant="outlined"
              margin="normal"
              value={recipient}
              onChange={(e: any) => {
                setRecipient(e.target.value);
              }}
            />

            <KeyboardArrowDownOutlined
              fontSize="large"
              htmlColor={customTheme.gold}
              onClick={(e: any) => setAnchorEl(e.target)}
            />
            <AddressSelectionMenu
              anchorEl={anchorEl}
              setAnchorEl={setAnchorEl}
              handleSelectAddress={handleSelectAddress}
            />
          </AddressSelectionWrapper>
          <TextHelperWrapper align="left">
            {/* TODO: how to check for them */}
            <Typography variant="body1" color={customTheme.red}>
              Make sure this is a valid address!
            </Typography>
          </TextHelperWrapper>
        </TextFieldWrapper>

        <ButtonRow>
          <Button
            type="reset"
            color="secondary"
            onClick={() => {
              setAmountString("");
              setRecipient("");
            }}
          >
            RESET
          </Button>

          <Button
            type="button"
            color="primary"
            disabled={!amountString || !recipient}
            onClick={() => {
              const amountNumber = parseFloat(amountString);
              const destination = new PublicKey(recipient);
              cosmicWallet.nativeTransfer(destination, amountNumber);
            }}
          >
            SEND
          </Button>
        </ButtonRow>
      </Page>
    );
  },
);

const Page = styled("div")(({ theme }) => ({
  [theme.breakpoints.up(theme.breakpoints.values.ext)]: {
    width: "50%",
    borderRadius: "20px",
    background: customTheme.dark2,
  },
  [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
    width: "90%",
    background: customTheme.dark,
  },
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  position: "relative",
}));

const HeaderRow = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
}));

const TextFieldWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
}));

const TextHelperWrapper = styled("div")<{
  align?: "left" | "center" | "right";
}>(({ theme, align }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: align ?? "right",
  width: "100%",
}));

const ButtonRow = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "80%",
  marginTop: "20px",
}));

const AddressSelectionWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
}));
