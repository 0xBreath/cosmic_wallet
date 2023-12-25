import React from "react";
import ReactDOM from "react-dom/client";
import { AppRoot } from "./AppRoot";
import "reflect-metadata";
import './popup/script.ts';
import './contentScript/contentScript.ts';

const el = document.getElementById("root");
if (el === null) throw new Error("Root container missing in index.html");

const root = ReactDOM.createRoot(el);

root.render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);

