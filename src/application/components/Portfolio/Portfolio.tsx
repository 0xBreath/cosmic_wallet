import React from "react";
import { observer } from "mobx-react";
import { CosmicWallet } from "../../../wallet";
import { Container, Table, TableBody, Row, Cell } from "./styles";
import {
  customTheme,
  RefreshState,
  shortenAddress,
  shortenNumber,
} from "../../../shared";
import { Typography } from "@mui/material";

const BalancesTable = observer(() => {
  const cosmicWallet = CosmicWallet.instance;

  return (
    <Container>
      <Table>
        <TableBody>
          <Row onClick={() => console.log("click: SOL")}>
            <Cell align="left">
              <Typography variant="body1">SOL</Typography>
            </Cell>
            <Cell align="right">
              <Typography variant="body1">
                {cosmicWallet.solanaBalance}
              </Typography>
            </Cell>
          </Row>

          {cosmicWallet.refreshTokenState === RefreshState.Ready &&
            [...cosmicWallet.tokenBalances.values()].map((value) => (
              <>
                <Row
                  onClick={() =>
                    console.log("click:", shortenAddress(value.mint))
                  }
                >
                  <Cell align="left">
                    <Typography variant="body1">
                      {shortenAddress(value.mint)}
                    </Typography>
                  </Cell>
                  <Cell align="right">
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
});

export const Portfolio = observer(() => {
  const cosmicWallet = CosmicWallet.instance;

  return <BalancesTable />;
});
