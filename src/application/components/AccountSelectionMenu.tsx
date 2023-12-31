import { observer } from "mobx-react";
import React, { useState } from "react";
import { CosmicWallet } from "../../wallet";
import { AddAccountDialog } from "./AddAccountDialog";
import { ExportMnemonicDialog } from "./ExportMnemonicDialog";
import { DeleteMnemonicDialog } from "./DeleteMnemonicDialog";
import { Divider, Menu, MenuItem, Typography } from "@mui/material";
import {
  AddOutlined,
  CheckOutlined,
  ExitToAppOutlined,
  FingerprintOutlined,
  ImportExportOutlined,
} from "@mui/icons-material";
import {
  copyToClipboard,
  customTheme,
  shortenAddress,
  WalletAccount,
} from "../../shared";
import { NavigationActionButton, StyledButton, StyledListItemIcon } from ".";

export const WebAccountSelectionMenu = observer(
  (): React.JSX.Element | null => {
    const cosmicWallet = CosmicWallet.instance;
    const { setWalletAccount, createAndSetAccount } = cosmicWallet;

    const [anchorEl, setAnchorEl] = useState(null);
    const [addAccountOpen, setAddAccountOpen] = useState(false);
    const [deleteMnemonicOpen, setDeleteMnemonicOpen] = useState(false);
    const [exportMnemonicOpen, setExportMnemonicOpen] = useState(false);

    if (cosmicWallet.walletAccounts.accounts.length === 0) {
      return null;
    }

    return (
      <>
        <AddAccountDialog
          open={addAccountOpen}
          onClose={() => setAddAccountOpen(false)}
          onAdd={(name, importedAccount) => {
            createAndSetAccount(name, importedAccount);
            setAddAccountOpen(false);
          }}
        />
        <ExportMnemonicDialog
          open={exportMnemonicOpen}
          onClose={() => setExportMnemonicOpen(false)}
        />
        <DeleteMnemonicDialog
          open={deleteMnemonicOpen}
          onClose={() => setDeleteMnemonicOpen(false)}
        />
        <StyledButton onClick={(e: any) => setAnchorEl(e.target)}>
          <Typography variant="h2">{"Account".toUpperCase()}</Typography>
        </StyledButton>
        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          {cosmicWallet.walletAccounts.accounts.map((account) => (
            <AccountListItem
              key={Math.random()}
              account={account}
              setAnchorEl={setAnchorEl}
              setWalletAccount={setWalletAccount}
            />
          ))}
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setAddAccountOpen(true);
            }}
          >
            <StyledListItemIcon>
              <AddOutlined fontSize="small" />
            </StyledListItemIcon>
            Add Account
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setExportMnemonicOpen(true);
            }}
          >
            <StyledListItemIcon>
              <ImportExportOutlined fontSize="small" />
            </StyledListItemIcon>
            Export Mnemonic
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setDeleteMnemonicOpen(true);
            }}
          >
            <StyledListItemIcon>
              <ExitToAppOutlined fontSize="small" />
            </StyledListItemIcon>
            Delete Mnemonic & Log Out
          </MenuItem>
        </Menu>
      </>
    );
  },
);

export const ExtensionAccountSelectionMenu = observer(
  (): React.JSX.Element | null => {
    const cosmicWallet = CosmicWallet.instance;
    const { setWalletAccount, createAndSetAccount } = cosmicWallet;

    const [anchorEl, setAnchorEl] = useState(null);
    const [addAccountOpen, setAddAccountOpen] = useState(false);
    const [deleteMnemonicOpen, setDeleteMnemonicOpen] = useState(false);
    const [exportMnemonicOpen, setExportMnemonicOpen] = useState(false);

    if (cosmicWallet.walletAccounts.accounts.length === 0) {
      return null;
    }

    return (
      <>
        <AddAccountDialog
          open={addAccountOpen}
          onClose={() => setAddAccountOpen(false)}
          onAdd={(name, importedAccount) => {
            createAndSetAccount(name, importedAccount);
            setAddAccountOpen(false);
          }}
        />
        <ExportMnemonicDialog
          open={exportMnemonicOpen}
          onClose={() => setExportMnemonicOpen(false)}
        />
        <DeleteMnemonicDialog
          open={deleteMnemonicOpen}
          onClose={() => setDeleteMnemonicOpen(false)}
        />
        <NavigationActionButton
          icon={
            <FingerprintOutlined
              fontSize={"large"}
              htmlColor={customTheme.light}
            />
          }
          onClick={(e: any) => setAnchorEl(e.target)}
        />
        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          {cosmicWallet.walletAccounts.accounts.map((account) => (
            <AccountListItem
              key={Math.random()}
              account={account}
              setAnchorEl={setAnchorEl}
              setWalletAccount={setWalletAccount}
            />
          ))}
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setAddAccountOpen(true);
            }}
          >
            <StyledListItemIcon>
              <AddOutlined fontSize="small" />
            </StyledListItemIcon>
            Add Account
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setExportMnemonicOpen(true);
            }}
          >
            <StyledListItemIcon>
              <ImportExportOutlined fontSize="small" />
            </StyledListItemIcon>
            Export Mnemonic
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              setDeleteMnemonicOpen(true);
            }}
          >
            <StyledListItemIcon>
              <ExitToAppOutlined fontSize="small" />
            </StyledListItemIcon>
            Delete Mnemonic & Log Out
          </MenuItem>
        </Menu>
      </>
    );
  },
);

// todo: types
const AccountListItem = ({
  account,
  setAnchorEl,
  setWalletAccount,
}: {
  account: WalletAccount;
  setAnchorEl: any;
  setWalletAccount: any;
}) => {
  const keypair = account.keypair;
  if (!keypair || !keypair.publicKey || !account.name) return null;

  return (
    <MenuItem
      key={keypair.publicKey.toString()}
      onClick={() => {
        setAnchorEl(null);
        setWalletAccount(account);
        copyToClipboard(keypair.publicKey.toString());
      }}
      selected={account.isSelected}
      component="div"
    >
      <StyledListItemIcon>
        {account.isSelected ? <CheckOutlined fontSize="small" /> : null}
      </StyledListItemIcon>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="h3">{account.name}</Typography>
        <Typography variant="body1" color="textSecondary">
          {shortenAddress(keypair.publicKey.toString())}
        </Typography>
      </div>
    </MenuItem>
  );
};
