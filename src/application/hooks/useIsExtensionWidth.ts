import {useMediaQuery} from "@mui/material";

export function useIsExtensionWidth() {
  return useMediaQuery("(max-width:450px)");
}