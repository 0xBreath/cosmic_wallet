import { ConnectionModel } from "../../core";
import React, { useState } from "react";
import {
  Hidden,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { CheckOutlined } from "@mui/icons-material";
import { observer } from "mobx-react";
import {
  AddCustomClusterDialog,
  NavigationActionButton,
  NetworkIcon,
  SolanaIcon,
  StyledButton,
  StyledListItemIcon,
} from ".";
import { customTheme } from "../../shared";

export const WebNetworkSelectionMenu = observer(() => {
  const cluster = ConnectionModel.instance.cluster;
  const [anchorEl, setAnchorEl] = useState(null);
  const [addCustomNetworkOpen, setCustomNetworkOpen] = useState(false);

  return (
    <>
      <AddCustomClusterDialog
        open={addCustomNetworkOpen}
        onClose={() => setCustomNetworkOpen(false)}
        onAdd={({ name, apiUrl }) => {
          ConnectionModel.instance.setCustomCluster(apiUrl, name);
          setCustomNetworkOpen(false);
        }}
      />
      <StyledButton onClick={(e: any) => setAnchorEl(e.target)}>
        <Typography variant="h3">
          {cluster?.label.toUpperCase() ?? "Network".toUpperCase()}
        </Typography>
      </StyledButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        {ConnectionModel.instance.clusters.map((option) => (
          <MenuItem
            key={option.httpEndPoint}
            onClick={() => {
              setAnchorEl(null);
              ConnectionModel.instance.selectCluster(option.slug);
            }}
            selected={option.httpEndPoint === cluster.httpEndPoint}
          >
            <StyledListItemIcon>
              {option.httpEndPoint === cluster.httpEndPoint ? (
                <CheckOutlined fontSize="small" />
              ) : null}
            </StyledListItemIcon>
            <Typography variant="h3">{option.label}</Typography>
          </MenuItem>
        ))}
        <MenuItem
          onClick={() => {
            setCustomNetworkOpen(true);
          }}
        >
          <StyledListItemIcon />
          {ConnectionModel.instance.customClusterExists
            ? "Edit Custom Endpoint"
            : "Add Custom Endpoint"}
        </MenuItem>
      </Menu>
    </>
  );
});

export const ExtensionNetworkSelectionMenu = observer(() => {
  const cluster = ConnectionModel.instance.cluster;
  const [anchorEl, setAnchorEl] = useState(null);
  const [addCustomNetworkOpen, setCustomNetworkOpen] = useState(false);

  return (
    <>
      <AddCustomClusterDialog
        open={addCustomNetworkOpen}
        onClose={() => setCustomNetworkOpen(false)}
        onAdd={({ name, apiUrl }) => {
          ConnectionModel.instance.setCustomCluster(apiUrl, name);
          setCustomNetworkOpen(false);
        }}
      />
      <NavigationActionButton
        icon={<NetworkIcon fontSize={"large"} htmlColor={customTheme.light} />}
        onClick={(e: any) => setAnchorEl(e.target)}
      />
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        {ConnectionModel.instance.clusters.map((option) => (
          <MenuItem
            key={option.httpEndPoint}
            onClick={() => {
              setAnchorEl(null);
              ConnectionModel.instance.selectCluster(option.slug);
            }}
            selected={option.httpEndPoint === cluster.httpEndPoint}
          >
            <StyledListItemIcon>
              {option.httpEndPoint === cluster.httpEndPoint ? (
                <CheckOutlined fontSize="small" />
              ) : null}
            </StyledListItemIcon>
            <Typography variant="h3">{option.label}</Typography>
          </MenuItem>
        ))}
        <MenuItem
          onClick={() => {
            setCustomNetworkOpen(true);
          }}
        >
          <StyledListItemIcon />
          {ConnectionModel.instance.customClusterExists
            ? "Edit Custom Endpoint"
            : "Add Custom Endpoint"}
        </MenuItem>
      </Menu>
    </>
  );
});