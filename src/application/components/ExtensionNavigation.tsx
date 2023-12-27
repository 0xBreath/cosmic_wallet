import * as React from "react";
import { BottomNavigation, BottomNavigationAction } from "@mui/material";
import { customTheme } from "../../shared";
import {
  FingerprintOutlined,
  SelfImprovementOutlined,
  AspectRatioOutlined,
  GridViewOutlined
} from "@mui/icons-material";
import { NetworkIcon } from '.';

const Icon = (props: { icon: JSX.Element }) => {
  const { icon } = props;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {icon}
    </div>
  );
};

const ActionButton = ({ icon, onClick }: { icon: React.JSX.Element; onClick?: () => void }) => {
  return (
    <BottomNavigationAction
      icon={
        <Icon
          icon={icon}
        />
      }
      sx={{
        "&.MuiBottomNavigationAction-root": {
          color: customTheme.light,
          font: customTheme.font.industry,
          // padding: "20px",
        },
      }}
      onClick={onClick}
    />
  );
};

export const ExtensionNavigation = () => {
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
      <ActionButton icon={<FingerprintOutlined fontSize={"large"} htmlColor={customTheme.light}/>}/>
      {/* Networks */}
      <ActionButton icon={<NetworkIcon fontSize={"large"} htmlColor={customTheme.light}/>} />
      {/* Connections */}
      <ActionButton icon={
        <GridViewOutlined fontSize="large" htmlColor={customTheme.light} />
      } />
      {/* Expand View (open web app) */}
      <ActionButton icon={
        <AspectRatioOutlined fontSize={"large"} htmlColor={customTheme.light} />
      } />
    </BottomNavigation>
  );
};
