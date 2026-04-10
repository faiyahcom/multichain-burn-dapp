import {
  getContractSwapFactory,
  getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";

export const useCreateWhitelistTokenEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  // Calling this function also enables the token if it is already whitelisted
  const createWhitelistToken = useCallback(
    async ({ tokenAddress }: { tokenAddress: string }) => {
      try {
        if (!isConnected || !walletProvider) {
          throw new Error("Wallet not connected");
        }

        const normalizedTokenAddress = ethers.getAddress(tokenAddress.trim());
        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider,
        );
        const signer = await provider.getSigner();
        const swapFactoryContract = getContractSwapFactory(signer);
        const tokenContract = getERC20Contract(normalizedTokenAddress, signer);

        try {
          await tokenContract.totalSupply();
        } catch {
          throw new Error("Token address is not a valid ERC20 contract");
        }

        const isTokenWhitelisted =
          await swapFactoryContract.isTokenWhitelisted(normalizedTokenAddress);

        if (isTokenWhitelisted) {
          throw new Error("Token is already whitelisted on-chain");
        }

        const tx =
          await swapFactoryContract.whitelistToken(normalizedTokenAddress);
        const receipt = await tx.wait();

        toast.success("Token whitelisted successfully!", {
          description: `Tx: ${receipt.hash}`,
        });

        return true;
      } catch (error: unknown) {
        toast.error("Failed to create whitelist token", {
          description: getErrorMessage({ error }),
        });
        console.log("error", error);
        return false;
      }
    },
    [isConnected, walletProvider],
  );

  return { createWhitelistToken };
};
