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
      {/*<NavigationActionButton*/}
      {/*  icon={*/}
      {/*    <FingerprintOutlined*/}
      {/*      fontSize={"large"}*/}
      {/*      htmlColor={customTheme.light}*/}
      {/*    />*/}
      {/*  }*/}
      {/*/>*/}
      {/* Networks */}
      <NavigationActionButton
        icon={<NetworkIcon fontSize={"large"} htmlColor={customTheme.light} />}
      />
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
      />
    </BottomNavigation>
  );
};
