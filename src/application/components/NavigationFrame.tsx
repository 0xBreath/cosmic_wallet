import React from "react";
import { useState } from "react";
import {
  AppBar,
  Badge,
  Button,
  Divider,
  Hidden,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  styled,
  Theme,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddAccountDialog,
  AddCustomClusterDialog,
  ConnectionIcon,
  CosmicWalletIcon,
  DeleteMnemonicDialog,
  ExportMnemonicDialog,
  SolanaIcon,
  ExtensionNavigation,
  WebAccountSelectionMenu,
} from ".";

import {
  AccountCircleOutlined,
  AddOutlined,
  CheckOutlined,
  CodeOutlined,
  ExitToAppOutlined,
  ImportExportOutlined,
  MonetizationOnOutlined,
  OpenInNewOutlined,
} from "@mui/icons-material";

import {
  customTheme,
  isExtension,
  isExtensionPopup,
  shortenAddress,
  theme,
  WalletAccountData,
} from "../../shared";
import { useIsExtensionWidth } from "../hooks";
import { Page, useConnectedWallets, usePage } from "../providers";
import { ConnectionModel } from "../../core";
import { CosmicWallet } from "../../wallet";
import { observer } from "mobx-react";

const Content = styled("div")(({ theme }) => ({
  flexGrow: 1,
  [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
    minHeight: "500px",
    maxWidth: theme.breakpoints.values.ext,
    minWidth: theme.breakpoints.values.ext,
  },
  // [theme.breakpoints.up(theme.breakpoints.values.ext)]: {
  //   paddingTop: 3,
  //   paddingLeft: 1,
  //   paddingRight: 1,
  // },
}));

const StyledButton = styled("button")(({ theme }: { theme: Theme }) => ({
  marginLeft: 1,
  backgroundColor: customTheme.gold,
  border: `1px solid ${customTheme.dark}`,
  borderRadius: "10px",
  padding: "5px 10px",
  height: "60px",
  width: "150px",
}));

const Text = styled("span")(({ theme }) => ({
  color: customTheme.dark,
  fontSize: "22px",
  fontFamily: customTheme.font.tungsten,
  fontWeight: 600,
  letterSpacing: "2px",
}));

const StyledListItemIcon: typeof ListItemIcon = styled(ListItemIcon)(
  ({ theme }) => ({
    minWidth: 32,
  }),
);

const StyledBadge: typeof Badge = styled(Badge)(
  ({ theme }: { theme: Theme }) => ({
    backgroundColor: theme.palette.success.main,
    color: theme.palette.primary.dark,
    height: 16,
    width: 16,
  }),
);

const StyledFooter = styled("footer")(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  margin: 2,
}));

export function NavigationFrame({ children }: { children: React.ReactNode }) {
  const isExtensionWidth = useIsExtensionWidth();
  return (
    <>
      <AppBar position="static">
        <Toolbar
          style={{
            opacity: 1,
            backgroundColor: customTheme.dark,
            padding: "20px",
          }}
        >
          <IconButton>
            <CosmicWalletIcon size={50} />
          </IconButton>
          <Typography
            variant={isExtensionWidth ? "h3" : "h2"}
            style={{
              flexGrow: 1,
            }}
          >
            COSMIC WALLET
          </Typography>
          {!isExtensionWidth && navigationButtons().map((button) => button)}
        </Toolbar>
      </AppBar>
      <Content>{children}</Content>
      {!isExtensionWidth && <Footer />}
    </>
  );
}

function navigationButtons(): React.JSX.Element[] {
  const isExtensionWidth = useIsExtensionWidth();
  const { page } = usePage();
  const [anchorEl, setAnchorEl] = useState(null);

  if (isExtensionPopup || isExtensionWidth) {
    return [];
  }

  let elements: (React.JSX.Element | null)[] = [];
  if (page === Page.Wallet) {
    elements.push(<WebAccountSelectionMenu key={Math.random()} />);
    elements.push(<NetworkSelector key={Math.random()} />);
  } else if (page === Page.Connections) {
    elements = [<WalletButton key={Math.random()} />];
  }
  return elements;
}

function ExpandButton() {
  const onClick = () => {
    window.open(chrome.extension.getURL("index.html"), "_blank");
  };

  return (
    <Tooltip title="Expand View">
      <IconButton color="inherit" onClick={onClick}>
        <OpenInNewOutlined />
      </IconButton>
    </Tooltip>
  );
}

function WalletButton() {
  const { setPage } = usePage();
  const onClick = () => setPage("wallet");

  return (
    <>
      <Hidden smUp>
        <Tooltip title="Wallet Balances">
          <IconButton color="inherit" onClick={onClick}>
            <MonetizationOnOutlined />
          </IconButton>
        </Tooltip>
      </Hidden>
      <Hidden xsDown>
        <StyledButton color="inherit" onClick={onClick}>
          Wallet
        </StyledButton>
      </Hidden>
    </>
  );
}

function ConnectionsButton() {
  const { setPage } = usePage();
  const onClick = () => setPage(Page.Connections);
  const connectedWallets = useConnectedWallets();

  const connectionAmount = Object.keys(connectedWallets).length;

  return (
    <>
      <Hidden smUp>
        <Tooltip title="Manage Connections">
          <IconButton color="inherit" onClick={onClick}>
            <StyledBadge badgeContent={connectionAmount}>
              <ConnectionIcon />
            </StyledBadge>
          </IconButton>
        </Tooltip>
      </Hidden>
      <Hidden xsDown>
        <StyledBadge badgeContent={connectionAmount}>
          <StyledButton onClick={onClick}>Connections</StyledButton>
        </StyledBadge>
      </Hidden>
    </>
  );
}

function NetworkSelector() {
  const cluster = ConnectionModel.instance.cluster;
  const [anchorEl, setAnchorEl] = useState(null);
  const [addCustomNetworkOpen, setCustomNetworkOpen] = useState(false);

  return (
    <>
      <AddCustomClusterDialog
        open={addCustomNetworkOpen}
        onClose={() => setCustomNetworkOpen(false)}
        onAdd={({ name, apiUrl }) => {
          ConnectionModel.instance.setCustomCluster(apiUrl, name);
          setCustomNetworkOpen(false);
        }}
      />
      <Hidden xsDown>
        <StyledButton onClick={(e: any) => setAnchorEl(e.target)}>
          <Text>{cluster?.label.toUpperCase() ?? "Network".toUpperCase()}</Text>
        </StyledButton>
      </Hidden>
      <Hidden smUp>
        <Tooltip title="Select Network" arrow>
          <IconButton
            color="inherit"
            onClick={(e: any) => setAnchorEl(e.target)}
          >
            <SolanaIcon />
          </IconButton>
        </Tooltip>
      </Hidden>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        {ConnectionModel.instance.clusters.map((option) => (
          <MenuItem
            key={option.httpEndPoint}
            onClick={() => {
              setAnchorEl(null);
              ConnectionModel.instance.selectCluster(option.slug);
            }}
            selected={option.httpEndPoint === cluster.httpEndPoint}
          >
            <StyledListItemIcon>
              {option.httpEndPoint === cluster.httpEndPoint ? (
                <CheckOutlined fontSize="small" />
              ) : null}
            </StyledListItemIcon>
            <Typography variant="h3">{option.label}</Typography>
          </MenuItem>
        ))}
        <MenuItem
          onClick={() => {
            setCustomNetworkOpen(true);
          }}
        >
          <StyledListItemIcon />
          {ConnectionModel.instance.customClusterExists
            ? "Edit Custom Endpoint"
            : "Add Custom Endpoint"}
        </MenuItem>
      </Menu>
    </>
  );
}

const Footer = () => {
  return (
    <StyledFooter>
      <Button
        variant="outlined"
        color="primary"
        component="a"
        target="_blank"
        rel="noopener"
        href="https://github.com/serum-foundation/spl-token-wallet"
        startIcon={<CodeOutlined />}
      >
        View Source
      </Button>
    </StyledFooter>
  );
};
