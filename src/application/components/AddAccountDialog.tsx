import React, { useState } from "react";
import { DialogForm } from ".";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Keypair } from "@solana/web3.js";
import { WalletSeedModel } from "../../core";
import { observer } from "mobx-react";
import { customTheme } from "../../shared";
import { CosmicWallet } from "../../wallet";

export type OnAddProps = {
  name: string;
  importedAccount: Keypair | undefined;
};

export type AddAccountDialogProps = {
  open: boolean;
  onAdd: (onAddProps: OnAddProps) => void;
  onClose: () => void;
};

export const AddAccountDialog = observer((props: AddAccountDialogProps) => {
  const seedModel = WalletSeedModel.instance;
  const { open, onAdd, onClose } = props;

  const [name, setName] = useState("");
  const [isImport, setIsImport] = useState(false);
  const [importedPrivateKey, setPrivateKey] = useState("");

  const importedAccount = isImport
    ? seedModel.decodeKeypair(importedPrivateKey)
    : undefined;
  const isAddEnabled = isImport ? name && importedAccount !== undefined : name;

  return (
    <DialogForm
      open={open}
      onClose={onClose}
      fullWidth
      onEntry={() => {
        setName("");
        setIsImport(false);
        setPrivateKey("");
      }}
      PaperProps={{
        style: {
          background: customTheme.dark,
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h2">Add account</Typography>
      </DialogTitle>
      <DialogContent style={{ paddingTop: 16 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TextField
            label="Name"
            fullWidth
            variant="outlined"
            margin="normal"
            value={name}
            onChange={(e: any) => {
              setName(e.target.value);
            }}
            sx={{
              zIndex: 2,
            }}
          />
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={isImport}
                  onChange={() => setIsImport(!isImport)}
                />
              }
              label="Import private key"
            />
          </FormGroup>
          {isImport && (
            <TextField
              label="Paste your private key here"
              fullWidth
              type="password"
              value={importedPrivateKey}
              variant="outlined"
              margin="normal"
              onChange={(e) => setPrivateKey(e.target.value.trim())}
            />
          )}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          type="submit"
          color="primary"
          disabled={!isAddEnabled}
          onClick={() => onAdd({ name, importedAccount })}
        >
          Add
        </Button>
      </DialogActions>
    </DialogForm>
  );
});
