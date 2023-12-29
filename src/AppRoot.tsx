import React from "react";
import "./shared/styles/globals.css";
import App from "./App";
import { ThemeProvider } from "@mui/material";
import { theme } from "./shared";

/** This component providers global styles and react contexts for the app. */
export const AppRoot = (): JSX.Element => {
  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
};
