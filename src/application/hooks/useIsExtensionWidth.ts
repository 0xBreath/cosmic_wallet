import {useMediaQuery} from "@mui/material";
import { theme } from "../../shared";

export function useIsExtensionWidth() {
  const extWidth = theme.breakpoints.values.ext;
  return useMediaQuery(`(max-width:${extWidth}px)`);
}