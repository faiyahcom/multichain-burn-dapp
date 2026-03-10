import { ZERO_ADDRESS } from "@/config/constant";
import type { NetworkConfig } from "@/config/networks";
import type { WhitelistToken } from "@/services/whitelistService";

type DisplayToken = {
  imageUri: string;
  name: string;
  symbol: string;
};

type ResolvePoolTokenDisplayParams = {
  network?: NetworkConfig;
  tokenAddress?: string;
  tokenSymbol?: string;
  whitelistToken?: Pick<WhitelistToken, "imageUri" | "name" | "symbol">;
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
  tokenSymbol,
  whitelistToken,
}: ResolvePoolTokenDisplayParams): DisplayToken => {
  if (isNativeToken(tokenAddress)) {
    const nativeCurrency = network?.appKitNetwork.nativeCurrency;

    return {
      imageUri: network?.iconSrc ?? "",
      name: nativeCurrency?.name ?? tokenSymbol ?? "Native",
      symbol: nativeCurrency?.symbol ?? tokenSymbol ?? "Native",
    };
  }

  if (whitelistToken) {
    return whitelistToken;
  }

  return {
    imageUri: "",
    name: tokenSymbol ?? "Unknown",
    symbol: tokenSymbol ?? "-",
  };
};
