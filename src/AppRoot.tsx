import React from "react";
import "./shared/styles/globals.css";
import App from "./App";

/** This component providers global styles and react contexts for the app. */
export const AppRoot = (): JSX.Element => {
  console.debug('inside AppRoot');
  return <App />;
};
