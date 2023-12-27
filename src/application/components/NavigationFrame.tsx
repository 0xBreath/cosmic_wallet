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
  ConnectionIcon,
  CosmicWalletIcon,
  WebAccountSelectionMenu,
  WebNetworkSelectionMenu,
  StyledButton,
} from ".";
import {
  CodeOutlined,
  MonetizationOnOutlined,
  OpenInNewOutlined,
} from "@mui/icons-material";

import { customTheme, isExtensionPopup } from "../../shared";
import { useIsExtensionWidth } from "../hooks";
import { Page, useConnectedWallets, usePage } from "../providers";

const Content = styled("div")(({ theme }) => ({
  flexGrow: 1,
  [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
    minHeight: "500px",
    maxWidth: theme.breakpoints.values.ext,
    minWidth: theme.breakpoints.values.ext,
  },
}));

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
    elements.push(<WebNetworkSelectionMenu key={Math.random()} />);
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
