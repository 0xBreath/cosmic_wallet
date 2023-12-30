import React from "react";
import { observer } from "mobx-react";
import { CosmicWallet } from "../../../wallet";
import { Container, Table, TableBody, Row, Cell } from "./styles";
import {
  customTheme,
  ParsedTokenBalance,
  RefreshState,
  shortenAddress,
  shortenNumber,
  TokenTransferInfo,
} from "../../../shared";
import { Typography } from "@mui/material";
import { TransferTokens } from "..";

const BalancesTable = observer(
  ({ sendToken }: { sendToken: (tokenInfo: TokenTransferInfo) => void }) => {
    const cosmicWallet = CosmicWallet.instance;

    return (
      <Container>
        <Table>
          <TableBody>
            <Row
              key={Math.random()}
              onClick={() =>
                sendToken({
                  mintOrSol: "sol",
                  accountBalance: cosmicWallet.solanaBalance,
                })
              }
            >
              <Cell align="left" key={Math.random()}>
                <Typography variant="body1">SOL</Typography>
              </Cell>
              <Cell align="right" key={Math.random()}>
                <Typography variant="body1">
                  {cosmicWallet.solanaBalance}
                </Typography>
              </Cell>
            </Row>

            {cosmicWallet.refreshTokenState === RefreshState.Ready &&
              [...cosmicWallet.tokenBalances.values()].map((value) => (
                <>
                  <Row
                    key={value.mint}
                    onClick={() =>
                      sendToken({
                        mintOrSol: value.mint,
                        accountBalance: value.uiAmount ?? 0,
                      })
                    }
                  >
                    <Cell align="left" key={Math.random()}>
                      <Typography variant="body1">
                        {shortenAddress(value.mint)}
                      </Typography>
                    </Cell>
                    <Cell align="right" key={Math.random()}>
                      <Typography variant="body1">
                        {shortenNumber(value.uiAmount ?? 0)}
                      </Typography>
                    </Cell>
                  </Row>
                </>
              ))}
          </TableBody>
        </Table>
      </Container>
    );
  },
);

export const Portfolio = observer(() => {
  const [showTransferPage, setShowTransferPage] = React.useState(false);
  const [tokenInfo, setTokenInfo] = React.useState<TokenTransferInfo | null>(
    null,
  );

  const onClose = () => {
    setShowTransferPage(false);
  };

  const sendToken = (tokenInfo: TokenTransferInfo) => {
    setTokenInfo(tokenInfo);
    setShowTransferPage(true);
  };

  if (showTransferPage && tokenInfo) {
    return <TransferTokens tokenInfo={tokenInfo} onClose={onClose} />;
  }

  return <BalancesTable sendToken={sendToken} />;
});
