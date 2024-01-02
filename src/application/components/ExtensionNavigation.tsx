import * as React from "react";
import { BottomNavigation } from "@mui/material";
import { customTheme } from "../../shared";
import {
  SwapHorizOutlined,
  HistoryOutlined,
  GridViewOutlined,
} from "@mui/icons-material";
import {
  ExtensionAccountSelectionMenu,
  ExtensionNetworkSelectionMenu,
  NavigationActionButton,
} from ".";

export const ExtensionNavigation = () => {
  return (
    <BottomNavigation
      sx={{
        position: "fixed",
        width: "100%",
        flexGrow: 1,
        height: "60px",
        zIndex: 10,
        bottom: 0,
        backgroundColor: customTheme.dark2,
      }}
    >
      {/* Accounts */}
      <ExtensionAccountSelectionMenu />
      {/* Networks */}
      <ExtensionNetworkSelectionMenu />
      {/* TODO: Swap Tokens */}
      <NavigationActionButton
        icon={
          <SwapHorizOutlined fontSize="large" htmlColor={customTheme.light} />
        }
      />
      {/* TODO: Transaction History */}
      <NavigationActionButton
        icon={
          <HistoryOutlined fontSize="large" htmlColor={customTheme.light} />
        }
      />
      {/* TODO: Connected Apps */}
      <NavigationActionButton
        icon={
          <GridViewOutlined fontSize="large" htmlColor={customTheme.light} />
        }
      />
    </BottomNavigation>
  );
};
