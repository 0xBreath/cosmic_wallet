import React from "react";
import { Container, Grid, styled } from "@mui/material";
import { useIsExtensionWidth } from "../hooks";
import { theme } from "../../shared";
import { Portfolio } from "../components";

const StyledContainer: typeof Container = styled(Container)(
  ({ theme: Theme }) => ({
    [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
      padding: "20px",
      minHeight: "400px",
      maxWidth: theme.breakpoints.values.ext,
      minWidth: theme.breakpoints.values.ext,
    },
    [theme.breakpoints.up(theme.breakpoints.values.ext)]: {
      maxWidth: theme.breakpoints.values.md,
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
    <Grid container spacing={isExtensionWidth ? 0 : 3}>
      <StyledGrid item xs={12}>
        <Portfolio />
      </StyledGrid>
    </Grid>
  );
}
