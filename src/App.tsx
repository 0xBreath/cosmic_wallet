import React, { Suspense } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";

import {
  ConnectedWalletsProvider,
  ConnectionsPage,
  ExtensionNavigation,
  LoadingIndicator,
  LoginPage,
  NavigationFrame,
  Page,
  PageProvider,
  PopupPage,
  TokenRegistryProvider,
  useIsExtensionWidth,
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
  const isExtensionWidth = useIsExtensionWidth();

  // Disallow rendering inside an iframe to prevent clickjacking.
  if (window.self !== window.top) {
    return null;
  }

  const appElement = (
    <NavigationFrame>
      <Suspense fallback={<LoadingIndicator />}>
        <PageContents />
        {isExtensionWidth && <ExtensionNavigation />}
      </Suspense>
    </NavigationFrame>
  );

  const env = isExtension ? (
    <ConnectedWalletsProvider>
      <PageProvider>{appElement}</PageProvider>
    </ConnectedWalletsProvider>
  ) : (
    appElement
  );

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ConnectionProvider endpoint={wallet.connection.rpcEndpoint}>
          <TokenRegistryProvider>
            <WalletProvider wallets={wallet.supportedWallets}>
              {env}
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
  const { page } = usePage();

  if (!CosmicWallet.instance.publicKey) {
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
