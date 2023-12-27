import React  from "react";
import { useState } from 'react';
import { DialogForm } from ".";
import {
  Button,
  DialogActions,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { WalletSeedModel } from "../../core";

export function DeleteMnemonicDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const seedModel = WalletSeedModel.instance;
  const [seedCheck, setSeedCheck] = useState("");
  const mnemonicAndSeed = seedModel.unlockedMnemonicAndSeed.unlockedMnemonic;
  return (
    <>
      <DialogForm
        open={open}
        onClose={onClose}
        onSubmit={() => {
          seedModel.forgetWallet();
          onClose();
        }}
        fullWidth
      >
        <DialogTitle>{"Delete Mnemonic & Log Out"}</DialogTitle>
        <DialogContentText style={{ margin: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            You will not be able to recover the current accounts without the
            seed phrase, and the account private key. This action will delete
            all current accounts from your browser.
            <br />
            <br />
            <strong>
              To prevent loss of funds, please ensure you have the seed phrase
              and the private key for all current accounts. You can view it by
              selecting "Export Mnemonic" in the user menu.
            </strong>
          </div>
          <TextField
            label={`Please type your seed phrase to confirm`}
            fullWidth
            variant="outlined"
            margin="normal"
            value={seedCheck}
            onChange={(e) => setSeedCheck(e.target.value)}
          />
        </DialogContentText>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button
            type="submit"
            color="secondary"
            disabled={
              seedModel.normalizeMnemonic(seedCheck) !==
              mnemonicAndSeed.mnemonic
            }
          >
            Delete
          </Button>
        </DialogActions>
      </DialogForm>
    </>
  );
}
