import React from 'react';

export const CosmicWalletIcon = ({ size }: { size: number }) => {
  return (
    <img
      src={require("/public/logo.png")}
      alt={"Cosmic Wallet"}
      width={size}
      height={size}
      style={{ borderRadius: "50%" }}
    />
  );
};
