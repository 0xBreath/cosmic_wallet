import React from "react";
import { Link, Typography } from "@mui/material";

export function LabelValue({
  label,
  value,
  link = false,
  onClick,
  gutterBottom,
}: {
  label: string;
  value: string;
  link?: boolean;
  onClick?: () => void;
  gutterBottom?: boolean;
}) {
  return (
    <Typography gutterBottom={gutterBottom}>
      {label}:{" "}
      {link ? (
        <Link href="#" onClick={onClick}>
          {value}
        </Link>
      ) : (
        <span style={{ color: "#7B7B7B" }}>{value}</span>
      )}
    </Typography>
  );
}
