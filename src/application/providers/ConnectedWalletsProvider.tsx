import React from "react";
import { createContext, useContext, useEffect, useState } from "react";

const ConnectedWalletsContext = createContext({});

export const ConnectedWalletsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [connectedWallets, setConnectedWallets] = useState({});

  useEffect(() => {
    const updateConnectionAmount = () => {
      chrome.storage.local.get("connectedWallets", (result) => {
        setConnectedWallets(result.connectedWallets || {});
      });
    };
    const listener = (changes: any) => {
      if ("connectedWallets" in changes) {
        updateConnectionAmount();
      }
    };
    updateConnectionAmount();
    chrome.storage.local.onChanged.addListener(listener);
    return () => chrome.storage.local.onChanged.removeListener(listener);
  }, []);

  return (
    <ConnectedWalletsContext.Provider value={connectedWallets}>
      {children}
    </ConnectedWalletsContext.Provider>
  );
};

export const useConnectedWallets = () => useContext(ConnectedWalletsContext);
