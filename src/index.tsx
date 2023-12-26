import React from "react";
import ReactDOM from "react-dom/client";
import { AppRoot } from "./AppRoot";

const el = document.getElementById("root");
if (el === null) throw new Error("Root container missing in index.html");

const root = ReactDOM.createRoot(el);

root.render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>,
);

/*
 React creates a "root" by default, which renders into the DOM for our app.
 React assumes that the root element exists because it lives in our index.html file.
 If the element is not found, the app will fail.

 To use the app on any website, such as a chrome extension, we can not assume anymore that the root element exists.
 That’s why we define the root element programmatically before rendering the React application.
 */

// const el = document.createElement("div");
// el.id = "cosmic-wallet-extension";
// document.body.appendChild(el);
//
// const root = ReactDOM.createRoot(el);
// root.render(
//   <React.StrictMode>
//     <AppRoot />
//   </React.StrictMode>
// );

