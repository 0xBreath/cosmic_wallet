import { Menu, MenuItem, Typography } from "@mui/material";
import React, { useState } from "react";
import { observer } from "mobx-react";
import { CosmicWallet } from "../../wallet";
import { shortenAddress } from "../../shared";
import { PublicKey } from "@solana/web3.js";

export const AddressSelectionMenu = observer(
  ({
    anchorEl,
    setAnchorEl,
    handleSelectAddress,
  }: {
    anchorEl: any;
    setAnchorEl: any;
    handleSelectAddress: (address: PublicKey) => void;
  }) => {
    const cosmicWallet = CosmicWallet.instance;

    return (
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        {/* TODO: address book from past transactions or manually added addresses */}
        {cosmicWallet.walletAccounts.accounts.map((account) => (
          <>
            {!!account.keypair && account.keypair.publicKey && (
              <AddressListItem
                key={Math.random()}
                address={account.keypair.publicKey}
                setAnchorEl={setAnchorEl}
                handleSelectAddress={handleSelectAddress}
              />
            )}
          </>
        ))}
      </Menu>
    );
  },
);

const AddressListItem = ({
  address,
  setAnchorEl,
  handleSelectAddress,
}: {
  address: PublicKey;
  setAnchorEl: any;
  handleSelectAddress: (address: PublicKey) => void;
}) => {
  return (
    <MenuItem
      key={address.toString()}
      onClick={() => {
        setAnchorEl(null);
        handleSelectAddress(address);
      }}
      component="div"
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Typography variant="body1" color="textSecondary">
          {shortenAddress(address.toString())}
        </Typography>
      </div>
    </MenuItem>
  );
};
