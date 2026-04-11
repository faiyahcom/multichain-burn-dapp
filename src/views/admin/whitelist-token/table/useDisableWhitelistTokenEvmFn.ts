import {
  EVM_POOL_TYPES,
  getContractAccessManager,
} from "@/web3/contracts/multichainBurnContractEVM";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";

const PHASE1_POOL_TYPES = [EVM_POOL_TYPES.BURN, EVM_POOL_TYPES.SWAP];

export const useDisableWhitelistTokenEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const disableWhitelistToken = useCallback(
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
        const accessManagerContract = getContractAccessManager(signer);

        const tx = await accessManagerContract.setTokenWhitelistForPoolTypes(
          PHASE1_POOL_TYPES,
          normalizedTokenAddress,
          false,
        );
        const receipt = await tx.wait();

        toast.success("Token whitelist disabled successfully!", {
          description: `Tx: ${receipt.hash}`,
        });

        return true;
      } catch (error: any) {
        toast.error("Failed to disable whitelist token", {
          description: getErrorMessage({ error }),
        });
        console.log("error", error);
        return false;
      }
    },
    [isConnected, walletProvider],
  );

  return { disableWhitelistToken };
};
