// import ed2curve from "./ed2curve";
import { PublicKey } from "@solana/web3.js";
import ed2curve from "ed2curve";

/**
 * Generate Diffie-Hellman keys
 * publicKey is a Uint8Array
 * secretKey is a Uint8Array
 * Returns { publicKey: Uint8Array, secretKey: Uint8Array }
 */
export const generateDiffieHellman = (
  publicKey: PublicKey,
  secretKey: Uint8Array,
) => {
  // local library for ed2curve
  // return ed2curve.convertKeyPair({
  //   publicKey: publicKey,
  //   secretKey: new Uint8Array(secretKey),
  // });

  // imported library for ed2curve
  return ed2curve.convertKeyPair({
    publicKey: publicKey.toBytes(),
    secretKey: new Uint8Array(secretKey),
  });
};
