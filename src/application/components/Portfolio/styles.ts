import { styled, Typography } from "@mui/material";
import { customTheme } from "../../../shared";

export const Container = styled("div")(({ theme }) => ({
  width: "100%",
  paddingTop: "30px",
  paddingBottom: "30px",
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
    width: "95%",
  },
  [theme.breakpoints.down(theme.breakpoints.values.ext)]: {
    width: "100%",
  },
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
}));

export const Divider = styled("span")(({ theme }) => ({
  width: "100%",
  height: "1px",
  background: customTheme.grey,
}));

export const Row = styled("tr")(({ theme }) => ({
  width: "100%",
  height: "80px",

  paddingLeft: "20px",
  paddingRight: "20px",

  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  textAlign: "center",

  "&:hover": {
    background: customTheme.dark2,
  },

  "&:first-of-type": {
    justifyContent: "left",
  },

  "&:last-of-type": {
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
