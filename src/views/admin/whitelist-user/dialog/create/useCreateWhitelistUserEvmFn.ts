import { getContractAccessManager } from "@/web3/contracts/multichainBurnContractEVM";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";

export const useCreateWhitelistUserEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const createWhitelistUser = useCallback(
    async ({ userAddress }: { userAddress: string }) => {
      try {
        if (!isConnected || !walletProvider) {
          throw new Error("Wallet not connected");
        }

        const normalizedUserAddress = ethers.getAddress(userAddress.trim());
        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider,
        );
        const signer = await provider.getSigner();
        const accessManagerContract = getContractAccessManager(signer);

        const tx =
          await accessManagerContract.setWhitelistedAccount(
            normalizedUserAddress,
            true,
          );
        const receipt = await tx.wait();

        toast.success("User whitelisted on EVM successfully!", {
          description: `Tx: ${receipt.hash}`,
        });

        return true;
      } catch (error: unknown) {
        toast.error("Failed to whitelist user on EVM", {
          description: getErrorMessage({ error }),
        });
        return false;
      }
    },
    [isConnected, walletProvider],
  );

  return { createWhitelistUser };
};
