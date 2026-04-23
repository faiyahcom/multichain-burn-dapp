import {
  getContractAccessManager,
  getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import type { PoolType } from "@/types/admin/master-pool-management";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";

export const useCreateWhitelistTokenEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const createWhitelistToken = useCallback(
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
          throw new Error("At least one pool type is required");
        }

        const normalizedTokenAddress = ethers.getAddress(tokenAddress.trim());
        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider,
        );
        const signer = await provider.getSigner();
        const accessManagerContract = getContractAccessManager(signer);
        const tokenContract = getERC20Contract(normalizedTokenAddress, signer);

        try {
          await tokenContract.totalSupply();
        } catch {
          throw new Error("Token address is not a valid ERC20 contract");
        }

        const whitelistStatuses = await Promise.all(
          poolTypes.map((poolType) =>
            accessManagerContract.isTokenWhitelisted(
              poolType,
              normalizedTokenAddress,
            ),
          ),
        );
        const poolTypesToEnable = poolTypes.filter(
          (_poolType, index) => !whitelistStatuses[index],
        );

        if (poolTypesToEnable.length === 0) {
          throw new Error(
            "Selected pool types are already whitelisted on-chain",
          );
        }

        const tx =
          await accessManagerContract.setTokenWhitelistForPoolTypes(
            poolTypesToEnable,
            normalizedTokenAddress,
            true,
          );
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
