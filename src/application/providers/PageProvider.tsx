import React from "react";
import { createContext, useContext, useState } from "react";

type PageContextProps = {
  page: string;
  setPage: (page: string) => void;
};

const DEFAULT_PAGE_CONTEXT: PageContextProps = {
  page: "wallet",
  setPage: () => {},
};

export enum Page {
  Wallet = "wallet",
  Connections = "connections",
}

const PageContext = createContext(DEFAULT_PAGE_CONTEXT);

export const PageProvider = ({ children }: { children: React.ReactNode }) => {
  const [page, setPage] = useState(Page.Wallet);

  const handleSetPage = (page: Page): void => {
    setPage(page);
  };

  return (
    <PageContext.Provider value={{ page, setPage: handleSetPage }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePage = () => useContext(PageContext);
