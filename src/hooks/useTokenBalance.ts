import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { useSystemStore } from "@/stores/systemStore";
import { useReadContract, useBalance } from "wagmi";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WSOL_ADDRESS, ZERO_ADDRESS } from "@/config/constant";
import { NETWORK_CONFIGS } from "@/config/networks";

type UseTokenBalanceParams = {
  tokenAddress?: string;
  decimals?: number;   // passed from parent
  symbol?: string;     // passed from parent
};



export const isNativeToken = (address?: string) => {
  if (!address) return false;
  return (
    address === ZERO_ADDRESS ||
    address === WSOL_ADDRESS
  );
};

export const isNativeTokenSymbol = (symbol?: string) => {
  if (!symbol) return false;
  const nativeSymbols = NETWORK_CONFIGS.map((n) => n.shortLabel);
  return nativeSymbols.includes(symbol);
};

export function useTokenBalance({
  tokenAddress,
  decimals,
  symbol,
}: UseTokenBalanceParams) {
  const selectedNetworkId = useSystemStore((state) => state.selectedNetworkId);
  const isSolanaNetwork = selectedNetworkId === "solanaDevnet";

  /* ==============================
     EVM
  ============================== */

  const {
    address: evmAddress,
    isConnected: isEvmConnected,
  } = useAppKitAccount({
    namespace: "eip155",
  });

  const isEvmNative = !isSolanaNetwork && isNativeToken(tokenAddress);

  const enabledEvmErc20 =
    !isSolanaNetwork &&
    isEvmConnected &&
    !!evmAddress &&
    !!tokenAddress &&
    !isEvmNative;

  const enabledEvmNative =
    !isSolanaNetwork &&
    isEvmConnected &&
    !!evmAddress &&
    isEvmNative;

  // ERC20 balance
  const { data: evmRawBalance, isLoading: isLoadingEvmErc20, refetch: refetchEvmErc20 } =
    useReadContract({
      address: tokenAddress as Address | undefined,
      abi: [
        {
          type: "function",
          name: "balanceOf",
          stateMutability: "view",
          inputs: [
            { name: "owner", type: "address" },
          ],
          outputs: [
            { name: "", type: "uint256" },
          ],
        },
      ] as const,
      functionName: "balanceOf",
      args: evmAddress ? [evmAddress as Address] : undefined,
      query: {
        enabled: enabledEvmErc20,
      },
    });

  // Native balance (ETH, BNB, etc.)
  const { data: evmNativeBalance, isLoading: isLoadingEvmNative, refetch: refetchEvmNative } =
    useBalance({
      address: evmAddress as Address | undefined,
      query: {
        enabled: enabledEvmNative,
      },
    });

  const evmFormatted = useMemo(() => {
    if (isEvmNative) {
      if (!evmNativeBalance) return "0";
      try {
        return formatUnits(
          evmNativeBalance.value,
          evmNativeBalance.decimals,
        );
      } catch {
        return "0";
      }
    }

    if (!evmRawBalance || decimals == null) return "0";

    try {
      return formatUnits(evmRawBalance as bigint, decimals);
    } catch {
      return "0";
    }
  }, [isEvmNative, evmNativeBalance, evmRawBalance, decimals]);

  /* ==============================
     SOLANA
  ============================== */

  const {
    address: solanaAddress,
    isConnected: isSolanaConnected,
  } = useAppKitAccount({
    namespace: "solana",
  });

  const { connection } = useAppKitConnection();

  const isSolanaNative = isSolanaNetwork && isNativeToken(tokenAddress);

  const [solanaFormatted, setSolanaFormatted] = useState<string>("0");
  const [isLoadingSolana, setIsLoadingSolana] = useState<boolean>(false);
  const [solanaRefetchCounter, setSolanaRefetchCounter] = useState(0);

  const solanaRefetch = useCallback(() => {
    setSolanaRefetchCounter((c) => c + 1);
  }, []);

  useEffect(() => {
    if (
      !isSolanaNetwork ||
      !isSolanaConnected ||
      !solanaAddress ||
      !connection
    ) {
      return;
    }

    let cancelled = false;

    const fetchBalance = async () => {
      try {
        setIsLoadingSolana(true);

        const owner = new PublicKey(solanaAddress);

        // Native SOL
        if (isSolanaNative) {
          const lamports = await connection.getBalance(owner);
          if (cancelled) return;

          setSolanaFormatted(
            (lamports / LAMPORTS_PER_SOL).toString()
          );
          return;
        }

        if (!tokenAddress) return;

        // SPL token
        const mint = new PublicKey(tokenAddress);

        const tokenAccounts =
          await connection.getParsedTokenAccountsByOwner(owner, {
            mint,
          });

        if (cancelled) return;

        if (tokenAccounts.value.length === 0) {
          setSolanaFormatted("0");
          return;
        }

        const amount =
          tokenAccounts.value[0].account.data.parsed.info.tokenAmount
            .uiAmountString;

        setSolanaFormatted(amount ?? "0");
      } catch {
        if (!cancelled) {
          setSolanaFormatted("0");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSolana(false);
        }
      }
    };

    fetchBalance();

    return () => {
      cancelled = true;
    };
  }, [
    isSolanaNetwork,
    isSolanaConnected,
    solanaAddress,
    tokenAddress,
    connection,
    isSolanaNative,
    solanaRefetchCounter,
  ]);

  /* ==============================
     RETURN
  ============================== */

  if (isSolanaNetwork) {
    return {
      balance: undefined,
      formatted: solanaFormatted,
      symbol,
      isLoading: isLoadingSolana,
      refetch: solanaRefetch,
    };
  }

  return {
    balance: isEvmNative
      ? evmNativeBalance?.value
      : (evmRawBalance as bigint | undefined),
    formatted: evmFormatted,
    symbol,
    isLoading: isEvmNative
      ? isLoadingEvmNative
      : isLoadingEvmErc20,
    refetch: isEvmNative ? refetchEvmNative : refetchEvmErc20,
  };
}