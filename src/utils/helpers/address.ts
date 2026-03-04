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
