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
import { useExtension, useIsExtensionWidth } from "../hooks";
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
    const extension = useExtension();

    return (
      <>
        <AppBar position="static">
          <Toolbar
            style={{
              opacity: 1,
              backgroundColor: customTheme.dark,
              padding: "20px",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: extension ? "100%" : "80%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
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
              <ButtonGroup />
            </div>
          </Toolbar>
        </AppBar>
        <Content>{children}</Content>
      </>
    );
  },
);

function ButtonGroup() {
  const isExtensionWidth = useIsExtensionWidth();
  const { page } = usePage();

  return (
    <>
      {isExtensionWidth && <ExpandViewButton />}
      {!isExtensionWidth && page === Page.Wallet && (
        <>
          <div style={{ paddingLeft: "10px", paddingRight: "10px" }}>
            <WebAccountSelectionMenu />
          </div>
          <div style={{ paddingLeft: "10px", paddingRight: "10px" }}>
            <WebNetworkSelectionMenu />
          </div>
        </>
      )}
      {!isExtensionWidth && page === Page.Connections && <WalletButton />}
    </>
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
