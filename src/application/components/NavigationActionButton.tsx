import * as React from "react";
import { BottomNavigationAction } from "@mui/material";
import { customTheme } from "../../shared";

export const NavigationActionButton = ({
  icon,
  onClick,
}: {
  icon: React.JSX.Element;
  onClick?: (e?: any) => void;
}) => {
  return (
    <BottomNavigationAction
      icon={<Icon icon={icon} />}
      sx={{
        "&.MuiBottomNavigationAction-root": {
          color: customTheme.light,
          font: customTheme.font.industry,
        },
      }}
      onClick={onClick}
    />
  );
};

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
