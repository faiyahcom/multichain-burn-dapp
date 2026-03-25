import { PublicKey } from "@solana/web3.js";
import { isAddress } from "ethers";

/**
 * Returns true if the string is a valid Solana base58 public key.
 */
export const isSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Returns true if the string is a valid EVM address (checksummed or not).
 */
export const isEvmAddress = (address: string): boolean => {
  return isAddress(address);
};

export const isSupportedWalletAddress = (address: string) => {
  return isEvmAddress(address) || isSolanaAddress(address);
};

export const areWalletAddressesEqual = (left?: string, right?: string) => {
  if (!left || !right) {
    return false;
  }

  const normalizedLeft = left.trim();
  const normalizedRight = right.trim();

  if (isEvmAddress(normalizedLeft) && isEvmAddress(normalizedRight)) {
    return normalizedLeft.toLowerCase() === normalizedRight.toLowerCase();
  }

  return normalizedLeft === normalizedRight;
};
