import { Theme, useMediaQuery } from "@mui/material";

export const useExtension = (): boolean => {
  return useMediaQuery((theme: Theme) =>
    theme.breakpoints.down(theme.breakpoints.values.ext),
  );
};
