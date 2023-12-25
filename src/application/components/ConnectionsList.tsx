import React, { useState } from "react";
import {
  AppBar,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Theme,
  Toolbar,
  Typography,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import {
  DeleteOutlined,
  DoneAllOutlined,
  ExpandLessOutlined,
  ExpandMoreOutlined,
} from "@mui/icons-material";
import { useConnectedWallets } from "../providers";
import { useIsExtensionWidth } from "../hooks";
import { CosmicWallet } from "../../wallet";

export function ConnectionsList() {
  const isExtensionWidth = useIsExtensionWidth();
  const connectedWallets = useConnectedWallets();

  return (
    <Paper>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }} component="h2">
            Connected Dapps
          </Typography>
        </Toolbar>
      </AppBar>
      <List disablePadding>
        {Object.entries(connectedWallets).map(([origin, connectedWallet]) => (
          <ConnectionsListItem
            origin={origin}
            connectedWallet={connectedWallet}
            key={origin}
          />
        ))}
      </List>
    </Paper>
  );
}

const ICON_SIZE = 28;
const IMAGE_SIZE = 24;

const useStyles = makeStyles((theme: Theme) => ({
  itemDetails: {
    marginLeft: 3,
    marginRight: 3,
    marginBottom: 2,
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-evenly",
    marginTop: 1,
    marginBottom: 1,
  },
  listItemIcon: {
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: ICON_SIZE,
    width: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
  },
  listItemImage: {
    height: IMAGE_SIZE,
    width: IMAGE_SIZE,
    borderRadius: IMAGE_SIZE / 2,
  },
}));

function ConnectionsListItem({
  origin,
  connectedWallet,
}: {
  origin: any;
  connectedWallet: any;
}) {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  // TODO better way to get high res icon?
  const appleIconUrl = origin + "/apple-touch-icon.png";
  const faviconUrl = origin + "/favicon.ico";
  const [iconUrl, setIconUrl] = useState(appleIconUrl);
  const accounts = CosmicWallet.instance.walletAccounts.accounts;
  // TODO better way to do this
  const account = accounts.find(
    (account) => account.address.toString() === connectedWallet.publicKey,
  );

  const setAutoApprove = (autoApprove: any) => {
    chrome.storage.local.get("connectedWallets", (result) => {
      result.connectedWallets[origin].autoApprove = autoApprove;
      chrome.storage.local.set({ connectedWallets: result.connectedWallets });
    });
  };

  const disconnectWallet = () => {
    chrome.storage.local.get("connectedWallets", (result) => {
      delete result.connectedWallets[origin];
      chrome.storage.local.set({ connectedWallets: result.connectedWallets });
    });
  };

  return (
    <>
      <ListItem>
        <ListItemButton onClick={() => setOpen((open) => !open)}>
          <ListItemIcon>
            <div className={classes.listItemIcon}>
              <img
                src={iconUrl}
                onError={() => setIconUrl(faviconUrl)}
                className={classes.listItemImage}
                alt=""
              />
            </div>
          </ListItemIcon>
          <div style={{ display: "flex", flex: 1 }}>
            <ListItemText primary={origin} secondary={account?.name} />
          </div>
          {open ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
        </ListItemButton>
      </ListItem>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <div className={classes.itemDetails}>
          <div className={classes.buttonContainer}>
            <Button
              variant={connectedWallet.autoApprove ? "contained" : "outlined"}
              color="primary"
              size="small"
              startIcon={<DoneAllOutlined />}
              onClick={() => setAutoApprove(!connectedWallet.autoApprove)}
            >
              {connectedWallet.autoApprove ? "Auto-Approved" : "Auto-Approve"}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<DeleteOutlined />}
              onClick={disconnectWallet}
            >
              Disconnect
            </Button>
          </div>
        </div>
      </Collapse>
    </>
  );
}
