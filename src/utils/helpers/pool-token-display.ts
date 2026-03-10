import { ZERO_ADDRESS } from "@/config/constant";
import type { NetworkConfig } from "@/config/networks";

type DisplayToken = {
  imageUri: string;
  name: string;
  symbol: string;
};

type ResolvePoolTokenDisplayParams = {
  network?: NetworkConfig;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenName?: string;
  customName?: string;
  customSymbol?: string;
  imageUri?: string;
};

const isNativeToken = (address?: string) => {
  if (!address) return false;

  return (
    address.toLowerCase() === ZERO_ADDRESS.toLowerCase() ||
    address.toLowerCase() === "native"
  );
};

export const resolvePoolTokenDisplay = ({
  network,
  tokenAddress,
  tokenName,
  tokenSymbol,
  customName,
  customSymbol,
  imageUri,
}: ResolvePoolTokenDisplayParams): DisplayToken => {
  if (isNativeToken(tokenAddress)) {
    const nativeCurrency = network?.appKitNetwork.nativeCurrency;

    return {
      imageUri: network?.iconSrc ?? "",
      name: nativeCurrency?.name ?? customName ?? tokenName ?? "Native",
      symbol: nativeCurrency?.symbol ?? customSymbol ?? tokenSymbol ?? "Native",
    };
  }

  return {
    imageUri: imageUri ?? "",
    name: customName ?? tokenName ?? "Unknown",
    symbol: customSymbol ?? tokenSymbol ?? "-",
  };
};
