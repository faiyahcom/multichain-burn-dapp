import { DEFAULT_NATIVE_DECIMALS } from "@/config/constant";
import { getDecimalsTokenNativeByChainId } from "@/config/networks";
import { ethers, type BrowserProvider } from "ethers";

const getReadableNativeContext = async (provider: BrowserProvider) => {
  const network = await provider.getNetwork();
  const nativeCurrency = getDecimalsTokenNativeByChainId(
    Number(network.chainId),
  );

  return {
    decimals: nativeCurrency?.decimals ?? DEFAULT_NATIVE_DECIMALS,
    symbol: nativeCurrency?.symbol ?? "Native",
  };
};

const formatInsufficientBalanceMessage = ({
  available,
  required,
  symbol,
  decimals,
}: {
  available: bigint;
  required: bigint;
  symbol: string;
  decimals: number;
}) =>
  `Insufficient ${symbol} balance. Required: ${ethers.formatUnits(required, decimals)} ${symbol}, available: ${ethers.formatUnits(available, decimals)} ${symbol}.`;

export const assertSufficientNativeBalanceForTransaction = async ({
  provider,
  address,
  estimateGas,
  txValue = 0n,
}: {
  provider: BrowserProvider;
  address: string;
  estimateGas: () => Promise<bigint>;
  txValue?: bigint;
}) => {
  const [nativeBalance, feeData, nativeContext] = await Promise.all([
    provider.getBalance(address),
    provider.getFeeData(),
    getReadableNativeContext(provider),
  ]);

  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice;
  if (!gasPrice) {
    throw new Error("Unable to estimate gas price for this transaction.");
  }

  if (nativeBalance < txValue) {
    throw new Error(
      formatInsufficientBalanceMessage({
        available: nativeBalance,
        required: txValue,
        symbol: nativeContext.symbol,
        decimals: nativeContext.decimals,
      }),
    );
  }

  let gasLimit: bigint;
  try {
    gasLimit = await estimateGas();
  } catch (error) {
    if (nativeBalance <= txValue) {
      throw new Error(
        formatInsufficientBalanceMessage({
          available: nativeBalance,
          required: txValue + gasPrice,
          symbol: nativeContext.symbol,
          decimals: nativeContext.decimals,
        }),
      );
    }

    throw error;
  }

  const gasCost = gasLimit * gasPrice;
  const totalRequired = txValue + gasCost;

  if (nativeBalance < totalRequired) {
    throw new Error(
      formatInsufficientBalanceMessage({
        available: nativeBalance,
        required: totalRequired,
        symbol: nativeContext.symbol,
        decimals: nativeContext.decimals,
      }),
    );
  }

  return {
    gasLimit,
    gasPrice,
    gasCost,
    totalRequired,
    nativeBalance,
  };
};
