import React from "react";
import { useState } from "react";
import {
  AppBar,
  Badge,
  Hidden,
  IconButton,
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
  ExpandViewButton,
  AddressDisplay,
} from ".";
import {
  AspectRatioOutlined,
  MonetizationOnOutlined,
} from "@mui/icons-material";

import {
  customTheme,
  EXTENSION_WIDTH,
  isExtension,
  isExtensionPopup,
} from "../../shared";
import { Page, useConnectedWallets, usePage } from "../providers";
import { observer } from "mobx-react";
import { useIsExtensionWidth } from "../hooks";
import { CosmicWallet } from "../../wallet";

const Content = styled("div")(({ theme }) => ({
  [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
    minHeight: "500px",
    maxWidth: EXTENSION_WIDTH,
    minWidth: EXTENSION_WIDTH,
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

export const NavigationFrame = observer(
  ({ children }: { children: React.ReactNode }) => {
    const cosmicWallet = CosmicWallet.instance;
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
              variant="h2"
              style={{
                flexGrow: 1,
              }}
            >
              COSMIC WALLET
            </Typography>
            <AddressDisplay />
            {isExtensionWidth ? (
              <ExpandViewButton />
            ) : (
              navigationButtons().map((button) => button)
            )}
          </Toolbar>
        </AppBar>
        <Content>{children}</Content>
      </>
    );
  },
);

function navigationButtons(): React.JSX.Element[] {
  const isExtensionWidth = useIsExtensionWidth();
  const { page } = usePage();

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
