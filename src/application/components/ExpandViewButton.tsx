import { IconButton } from "@mui/material";
import { AspectRatioOutlined } from "@mui/icons-material";
import { customTheme } from "../../shared";
import React from "react";

export const ExpandViewButton = () => {
  return (
    <IconButton
      onClick={() => {
        window.open(chrome.extension.getURL("src/index.html"), "_blank");
      }}
    >
      <AspectRatioOutlined fontSize={"large"} htmlColor={customTheme.light} />
    </IconButton>
  );
};
