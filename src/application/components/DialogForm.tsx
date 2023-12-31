import React from "react";
import { Dialog, DialogProps, useMediaQuery, useTheme } from "@mui/material";
import { customTheme } from "../../shared";

export type DialogFormProps = {
  onEntry?: () => void;
  onSubmit?: () => void;
  children: React.ReactNode;
} & DialogProps;

export const DialogForm = (props: DialogFormProps) => {
  const { onSubmit, onEntry, children } = props;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  React.useEffect(() => {
    if (onEntry) {
      onEntry();
    }
  }, []);

  return (
    <Dialog
      PaperProps={{
        component: "form",
        onSubmit: (e: any) => {
          e.preventDefault();
          if (onSubmit) {
            onSubmit();
          }
        },
      }}
      fullScreen={fullScreen}
      {...props}
    >
      {children}
    </Dialog>
  );
};
