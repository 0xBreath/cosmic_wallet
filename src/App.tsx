import React, { Suspense } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";

import {
  ConnectedWalletsProvider,
  ConnectionsPage,
  LoadingIndicator,
  LoginPage,
  NavigationFrame,
  Page,
  PageProvider,
  PopupPage,
  TokenRegistryProvider,
  usePage,
  WalletPage,
} from "./application";
import { isExtension, theme } from "./shared";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { CosmicWallet } from "./wallet";
import { observer } from "mobx-react";

export const App = observer(() => {
  const wallet = CosmicWallet.instance;

  // Disallow rendering inside an iframe to prevent clickjacking.
  if (window.self !== window.top) {
    console.debug('exit');
    return null;
  }

  let appElement = (
    <NavigationFrame>
      <Suspense fallback={<LoadingIndicator />}>
        <PageContents />
      </Suspense>
    </NavigationFrame>
  );

  if (isExtension) {
    console.debug('isExtension');
    appElement = (
      <ConnectedWalletsProvider>
        <PageProvider>{appElement}</PageProvider>
      </ConnectedWalletsProvider>
    );
  }

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ConnectionProvider endpoint={wallet.connection.rpcEndpoint}>
          <TokenRegistryProvider>
            <WalletProvider wallets={wallet.supportedWallets}>
              {appElement}
            </WalletProvider>
          </TokenRegistryProvider>
        </ConnectionProvider>
      </ThemeProvider>
    </Suspense>
  );
});

/// Handle creating/importing a wallet if needed.
/// Then log into the wallet.
/// Then enter the app.
const PageContents = observer(() => {
  const publicKey = CosmicWallet.instance.publicKey;
  const { page } = usePage();
  if (!publicKey) {
    return <LoginPage />;
  }
  if (window.opener) {
    return <PopupPage opener={window.opener} />;
  }
  switch (page) {
    case Page.Wallet:
      return <WalletPage />;
    case Page.Connections:
      return <ConnectionsPage />;
    default:
      throw new Error("PageContents should not be undefined");
  }
});

export default App;
