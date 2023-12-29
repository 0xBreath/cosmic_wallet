import { styled, Typography } from "@mui/material";
import { customTheme } from "../../../shared";

export const Container = styled("div")(({ theme }) => ({
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

export const Table = styled("table")(({ theme }) => ({
  [theme.breakpoints.up(theme.breakpoints.values.ext)]: {
    width: "70%",
    borderRadius: "20px",
    background: customTheme.dark2,
  },
  [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
    width: "100%",
    background: customTheme.dark,
  },
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
}));

export const TableBody = styled("tbody")(({ theme }) => ({
  [theme.breakpoints.up(theme.breakpoints.values.ext)]: {
    width: "90%",
  },
  [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
    width: "100%",
  },
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
}));

export const Row = styled("tr")(({ theme }) => ({
  width: "100%",
  height: "60px",

  paddingLeft: "20px",
  paddingRight: "20px",

  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  textAlign: "center",

  borderBottom: `1px solid ${customTheme.grey}`,

  "&:hover": {
    background: customTheme.dark2,
  },

  "&:first-child": {
    justifyContent: "left",
  },

  "&:last-child": {
    justifyContent: "right",
  },
}));

export const Cell = styled("td")<{
  color?: string;
  align?: "left" | "center" | "right";
}>(({ theme, color, align }) => ({
  overflow: "hidden",
  textOverflow: "ellipsis",
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: align,
  color: color || "",
}));
