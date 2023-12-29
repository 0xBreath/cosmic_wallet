import { Theme, useMediaQuery } from "@mui/material";
import { EXTENSION_WIDTH } from "../../shared";

export function useIsExtensionWidth() {
  return useMediaQuery(`(max-width:${EXTENSION_WIDTH})`);
}
