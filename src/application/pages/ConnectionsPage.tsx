import React from "react";
import { Container, Grid, Theme } from "@mui/material";
import { makeStyles } from "@mui/styles";
import { useIsExtensionWidth } from "../hooks";
import { ConnectionsList } from "../components";
import {theme} from "../../shared";

const useStyles = makeStyles((theme: Theme) => ({
  container: {
    [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
      padding: '20px',
      minHeight: '400px',
      maxWidth: theme.breakpoints.values.ext,
      minWidth: theme.breakpoints.values.ext
    },
    [theme.breakpoints.up(theme.breakpoints.values.ext)]: {
      maxWidth: theme.breakpoints.values.md,
    },
  },
}));

export function ConnectionsPage() {
  const classes = useStyles();
  const isExtensionWidth = useIsExtensionWidth();
  return (
    <Container fixed className={classes.container}>
      <Grid container spacing={isExtensionWidth ? 0 : 3}>
        <Grid item xs={12}>
          <ConnectionsList />
        </Grid>
      </Grid>
    </Container>
  );
}
