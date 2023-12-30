import React from "react";
import { useState } from "react";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import { DialogForm } from ".";
import { CosmicWallet } from "../../wallet";
import { WalletSeedManager } from "../../core";

export function ExportMnemonicDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [isHidden, setIsHidden] = useState(true);
  const cosmicWallet = CosmicWallet.instance;
  const seedModel = WalletSeedManager.instance;
  const mnemKey = seedModel.unlockedMnemonicAndSeed.unlockedMnemonic;
  return (
    <DialogForm open={open} onClose={onClose} fullWidth>
      <DialogTitle>Export mnemonic</DialogTitle>
      <DialogContent>
        <TextField
          label="Mnemonic"
          fullWidth
          type={isHidden ? "password" : undefined}
          variant="outlined"
          margin="normal"
          value={mnemKey.mnemonic}
        />
        <FormControlLabel
          control={
            <Switch
              checked={!isHidden}
              onChange={() => setIsHidden(!isHidden)}
            />
          }
          label="Reveal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </DialogForm>
  );
}
