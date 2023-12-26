import React from 'react';

export const CosmicWalletIcon = ({ size }: { size: number }) => {
  return (
    <img
      src={"assets/logo.png"}
      width={size}
      height={size}
      style={{ borderRadius: "50%" }}
    />
  );
};
