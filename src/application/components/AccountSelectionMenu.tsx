import { observer } from "mobx-react";
import React, { useState } from "react";
import { CosmicWallet } from "../../wallet";
import { AddAccountDialog } from "./AddAccountDialog";
import { ExportMnemonicDialog } from "./ExportMnemonicDialog";
import { DeleteMnemonicDialog } from "./DeleteMnemonicDialog";
import {
  Divider,
  Hidden,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  styled,
  Theme,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AccountCircleOutlined,
  AddOutlined,
  CheckOutlined,
  ExitToAppOutlined,
  FingerprintOutlined,
  ImportExportOutlined,
} from "@mui/icons-material";
import { customTheme, shortenAddress, WalletAccountData } from "../../shared";
import { NavigationActionButton, StyledButton, StyledListItemIcon } from ".";

export const WebAccountSelectionMenu = observer(
  (): React.JSX.Element | null => {
    const cosmicWallet = CosmicWallet.instance;
    const { addAccount, setWalletSelector } = cosmicWallet;

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
          onAdd={({ name, importedAccount }) => {
            addAccount({ name, importedAccount });
            setWalletSelector({
              walletIndex: importedAccount
                ? undefined
                : cosmicWallet.walletAccounts.derivedAccounts.length,
              importedPubkey: importedAccount
                ? importedAccount.publicKey
                : undefined,
            });
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
              setWalletSelector={setWalletSelector}
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
    const { addAccount, setWalletSelector } = cosmicWallet;

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
          onAdd={({ name, importedAccount }) => {
            addAccount({ name, importedAccount });
            setWalletSelector({
              walletIndex: importedAccount
                ? undefined
                : cosmicWallet.walletAccounts.derivedAccounts.length,
              importedPubkey: importedAccount
                ? importedAccount.publicKey
                : undefined,
            });
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
              setWalletSelector={setWalletSelector}
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
  setWalletSelector,
}: {
  account: WalletAccountData;
  setAnchorEl: any;
  setWalletSelector: any;
}) => {
  console.log("account", account.name, account.isSelected);
  return (
    <MenuItem
      key={account.address.toString()}
      onClick={() => {
        setAnchorEl(null);
        setWalletSelector(account.selector);
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
          {shortenAddress(account.address.toString())}
        </Typography>
      </div>
    </MenuItem>
  );
};
