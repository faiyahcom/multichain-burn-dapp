import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { isEvmAddress, isSolanaAddress } from "@/utils/helpers/address";
import type { NetworkId } from "@/config/networks";
import {
  detectAssetType,
  getTokenProgramFromAssetType,
} from "@/web3/helpers";
import { WSOL_ADDRESS } from "@/config/constant";

const ERC20_DECIMALS_ABI = [
  {
    type: "function" as const,
    name: "decimals",
    stateMutability: "view" as const,
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

type UseTokenDecimalsParams = {
  address: string;
  networkId?: NetworkId;
};

/**
 * Fetches the decimals of a token on-chain.
 * - EVM: uses wagmi `useReadContract` with the ERC20 `decimals()` selector.
 * - Solana: detects asset type (SPL / SPL2022 / Native) then uses `getMint`
 *   with the correct token program.
 *
 * Returns `{ decimals, isLoading, error }`.
 */
export function useTokenDecimals({ address, networkId }: UseTokenDecimalsParams) {
  const isSolana = networkId === "solana";
  const isEvm = !isSolana && !!networkId;

  const validEvmAddress = isEvm && isEvmAddress(address);
  const validSolanaAddress = isSolana && isSolanaAddress(address);

  // ── EVM ──────────────────────────────────────────────────────────────────
  const {
    data: evmDecimals,
    isLoading: isEvmLoading,
    error: evmError,
  } = useReadContract({
    address: validEvmAddress ? (address as `0x${string}`) : undefined,
    abi: ERC20_DECIMALS_ABI,
    functionName: "decimals",
    query: {
      enabled: validEvmAddress,
    },
  });

  // ── Solana ───────────────────────────────────────────────────────────────
  const { connection } = useAppKitConnection();

  const [solanaDecimals, setSolanaDecimals] = useState<number | undefined>(
    undefined,
  );
  const [isSolanaLoading, setIsSolanaLoading] = useState(false);
  const [solanaError, setSolanaError] = useState<Error | null>(null);

  useEffect(() => {
    if (!validSolanaAddress || !connection) {
      setSolanaDecimals(undefined);
      setSolanaError(null);
      return;
    }

    let cancelled = false;
    setIsSolanaLoading(true);
    setSolanaError(null);

    (async () => {
      try {
        const mint = new PublicKey(address);

        // Native SOL (WSOL) → always 9 decimals
        if (address === WSOL_ADDRESS) {
          if (!cancelled) {
            setSolanaDecimals(9);
          }
          return;
        }

        // Detect whether the mint is SPL or Token-2022
        const assetType = await detectAssetType(connection, mint);
        const tokenProgram = getTokenProgramFromAssetType(assetType) ?? undefined;

        const mintInfo = await getMint(
          connection,
          mint,
          undefined,
          tokenProgram,
        );
        if (!cancelled) {
          setSolanaDecimals(mintInfo.decimals);
        }
      } catch (err) {
        if (!cancelled) {
          setSolanaDecimals(undefined);
          setSolanaError(
            err instanceof Error ? err : new Error("Failed to fetch decimals"),
          );
        }
      } finally {
        if (!cancelled) {
          setIsSolanaLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [validSolanaAddress, address, connection]);

  // ── Result ───────────────────────────────────────────────────────────────
  if (isSolana) {
    return {
      decimals: solanaDecimals,
      isLoading: isSolanaLoading,
      error: solanaError,
    };
  }

  return {
    decimals: evmDecimals != null ? Number(evmDecimals) : undefined,
    isLoading: isEvmLoading,
    error: evmError,
  };
}

