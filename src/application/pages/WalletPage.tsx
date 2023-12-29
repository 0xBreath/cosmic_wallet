import React from "react";
import { Grid, styled } from "@mui/material";
import { customTheme, EXTENSION_WIDTH, theme } from "../../shared";
import { Portfolio } from "../components";

export const Container = styled("div")(({ theme }) => ({
  [theme.breakpoints.up(theme.breakpoints.values.ext)]: {
    width: "100%",
  },
  [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
    width: EXTENSION_WIDTH,
    marginBottom: "60px",
  },
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

const StyledGrid: typeof Grid = styled(Grid)(({ theme: Theme }) => ({
  [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
    marginBottom: 24,
  },
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

export function WalletPage() {
  return (
    <Container>
      <StyledGrid item xs={12}>
        <Portfolio />
      </StyledGrid>
    </Container>
  );
}
