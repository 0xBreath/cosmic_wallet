import { styled, Theme } from "@mui/material";
import { customTheme } from "../../shared";

export const StyledButton = styled("button")(({ theme }: { theme: Theme }) => ({
  marginLeft: 1,
  backgroundColor: customTheme.gold,
  border: `1px solid ${customTheme.dark}`,
  borderRadius: "10px",
  padding: "5px 10px",
  height: "60px",
  width: "150px",
}));
