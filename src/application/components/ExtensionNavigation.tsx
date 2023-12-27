import * as React from "react";
import { BottomNavigation } from "@mui/material";
import { customTheme } from "../../shared";
import {
  FingerprintOutlined,
  AspectRatioOutlined,
  GridViewOutlined,
} from "@mui/icons-material";
import {
  ExtensionAccountSelectionMenu,
  ExtensionNetworkSelectionMenu,
  NavigationActionButton,
  NetworkIcon,
} from ".";

export const ExtensionNavigation = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  return (
    <BottomNavigation
      sx={{
        position: "fixed",
        width: "100%",
        flexGrow: 1,
        height: "10%",
        zIndex: 10,
        bottom: 0,
        backgroundColor: customTheme.dark2,
      }}
    >
      {/* Accounts */}
      <ExtensionAccountSelectionMenu />
      {/* Networks */}
      <ExtensionNetworkSelectionMenu />
      {/* Connections */}
      <NavigationActionButton
        icon={
          <GridViewOutlined fontSize="large" htmlColor={customTheme.light} />
        }
      />
      {/* Expand View (open web app) */}
      <NavigationActionButton
        icon={
          <AspectRatioOutlined
            fontSize={"large"}
            htmlColor={customTheme.light}
          />
        }
        onClick={() => {
          window.open(chrome.extension.getURL("src/index.html"), "_blank");
        }}
      />
    </BottomNavigation>
  );
};
