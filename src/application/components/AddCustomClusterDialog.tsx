import React, { useState } from "react";
import { DialogForm } from "./DialogForm";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

type OnAddProps = {
  name: string;
  apiUrl: string;
};

export type AddCustomClusterDialogProps = {
  open: boolean;
  onAdd: (onAddProps: OnAddProps) => void;
  onClose: () => void;
};

export const AddCustomClusterDialog = (props: AddCustomClusterDialogProps) => {
  const { open, onAdd, onClose } = props;

  const [name, setName] = useState("");
  const [apiUrl, setApiUrl] = useState("");

  if (open) {
    setName("");
    setApiUrl("");
  }

  return (
    <DialogForm
      open={open}
      onEntry={() => {
        setName("");
        setApiUrl("");
      }}
      onClose={onClose}
      onSubmit={() => onAdd({ name, apiUrl })}
      fullWidth
    >
      <DialogTitle>Add Custom Network</DialogTitle>
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
            onChange={(e) => setName(e.target.value.trim())}
          />
          <TextField
            label="Url"
            fullWidth
            variant="outlined"
            margin="normal"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value.trim())}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button type="submit" color="primary">
          Add
        </Button>
      </DialogActions>
    </DialogForm>
  );
};
