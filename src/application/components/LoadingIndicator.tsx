import React  from "react";
import { useState } from 'react';
import { useEffectAfterTimeout } from "../hooks";
import { CircularProgress, styled } from "@mui/material";

const Container = styled("div")<{ height?: string | number }>(
  ({ theme, height }) => ({
    width: "100%",
    height: `${height || "100%"}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  }),
);

export function LoadingIndicator({
  height,
  delay = 500,
  ...rest
}: {
  height?: number | string;
  delay?: number;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [visible, setVisible] = useState(false);

  useEffectAfterTimeout(() => setVisible(true), delay);

  let style = {};
  if (height) {
    style = {
      height,
    };
  }

  if (!visible) {
    return height ? <div style={style} /> : null;
  }

  return (
    <Container height={height} {...rest}>
      <CircularProgress />
    </Container>
  );
}
