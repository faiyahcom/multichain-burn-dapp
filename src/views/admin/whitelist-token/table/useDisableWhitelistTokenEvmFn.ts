import {
  getContractAccessManager,
} from "@/web3/contracts/multichainBurnContractEVM";
import type { PoolType } from "@/types/admin/master-pool-management";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";

export const useDisableWhitelistTokenEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const disableWhitelistToken = useCallback(
    async ({
      tokenAddress,
      poolTypes,
    }: {
      tokenAddress: string;
      poolTypes: PoolType[];
    }) => {
      try {
        if (!isConnected || !walletProvider) {
          throw new Error("Wallet not connected");
        }
        if (poolTypes.length === 0) {
          return true;
        }

        const normalizedTokenAddress = ethers.getAddress(tokenAddress.trim());
        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider,
        );
        const signer = await provider.getSigner();
        const accessManagerContract = getContractAccessManager(signer);
        const whitelistStatuses = await Promise.all(
          poolTypes.map((poolType) =>
            accessManagerContract.isTokenWhitelisted(
              poolType,
              normalizedTokenAddress,
            ),
          ),
        );
        const activePoolTypes = poolTypes.filter(
          (_poolType, index) => whitelistStatuses[index],
        );

        if (activePoolTypes.length === 0) {
          return true;
        }

        const tx = await accessManagerContract.setTokenWhitelistForPoolTypes(
          activePoolTypes,
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
