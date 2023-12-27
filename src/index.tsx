import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { AppRoot } from "./AppRoot";

const el = document.getElementById("app");
if (el === null) throw new Error("Root container missing in index.html");

const root = ReactDOM.createRoot(el);

console.debug('Running index.tsx');

root.render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);
