import React from "react";
import { Container, Grid, styled } from "@mui/material";
import { useIsExtensionWidth } from "../hooks";
import { theme } from "../../shared";

const StyledContainer: typeof Container = styled(Container)(
  ({ theme: Theme }) => ({
    [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
      padding: 0,
    },
    [theme.breakpoints.up(theme.breakpoints.values.ext)]: {
      maxWidth: "md",
    },
  }),
);

const StyledGrid: typeof Grid = styled(Grid)(({ theme: Theme }) => ({
  [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
    marginBottom: 24,
  },
}));

export function WalletPage() {
  const isExtensionWidth = useIsExtensionWidth();
  return (
    <StyledContainer fixed maxWidth="md">
      <Grid container spacing={isExtensionWidth ? 0 : 3}>
        <StyledGrid item xs={12}>
          {/*<BalancesList />*/}
          TODO: BalancesList
        </StyledGrid>
      </Grid>
    </StyledContainer>
  );
}
