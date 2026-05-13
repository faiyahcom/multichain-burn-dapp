import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import {
  getContractLaunchpadFactory,
  getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { isNativeToken } from "@/hooks/useTokenBalance";

const RATIO_DENOMINATOR = 10_000n;

// Enum orderings — must match ILaunchpadPool Solidity enums
const LaunchpadPoolType = { Dynamic: 0, Fixed: 1 } as const;
const ClaimPolicy = { Instant: 0, AfterEnd: 1 } as const;
const DistributionMode = { None: 0, Automatic: 1, Claim: 2 } as const;

export interface EditLaunchpadPoolEvmParams {
  poolAddress: string;
  name: string;
  startTime: number; // unix seconds
  endTime: number; // unix seconds
  mode: "fixed" | "dynamic";
  price: string; // human-readable price (ignored for dynamic pools)
  claimPolicy: "instant" | "after_end_auto" | "after_end_claim";
  budget: string; // human-readable total sale amount
  saleToken: string; // sale token address (for ERC20 approval)
  saleTokenDecimals: number; // sale token decimals
}

export const useEditLaunchpadPoolEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const editPool = useCallback(
    async (params: EditLaunchpadPoolEvmParams): Promise<void> => {
      try {
        if (!isConnected || !walletProvider) {
          throw new Error("Wallet not connected");
        }

        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider,
        );
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const contract = getContractLaunchpadFactory(signer);
        const contractAddress = await contract.getAddress();

        const saleIsNative = isNativeToken(params.saleToken);
        const totalSaleAmount = ethers.parseUnits(
          params.budget || "0",
          params.saleTokenDecimals,
        );

        const isFixed = params.mode === "fixed";
        const saleRate = isFixed ? RATIO_DENOMINATOR : 0n;
        const depositRate = isFixed
          ? BigInt(
              Math.round(
                Number(params.price ?? "0") * Number(RATIO_DENOMINATOR),
              ),
            )
          : 0n;

        const poolType = isFixed ? LaunchpadPoolType.Fixed : LaunchpadPoolType.Dynamic;
        const claimPolicyEnum =
          params.claimPolicy === "instant" ? ClaimPolicy.Instant : ClaimPolicy.AfterEnd;
        const distributionModeEnum =
          params.claimPolicy === "instant"
            ? DistributionMode.None
            : params.claimPolicy === "after_end_auto"
              ? DistributionMode.Automatic
              : DistributionMode.Claim;

        const payload = {
          name: ethers.encodeBytes32String(params.name.slice(0, 31)),
          totalSaleAmount,
          startTime: BigInt(params.startTime),
          endTime: BigInt(params.endTime),
          poolType,
          claimPolicy: claimPolicyEnum,
          distributionMode: distributionModeEnum,
          saleRate,
          depositRate,
        };

        // Approve ERC20 sale token allowance before editing
        if (totalSaleAmount > 0n && !saleIsNative) {
          const saleTokenContract = getERC20Contract(params.saleToken, signer);
          const balance: bigint = await saleTokenContract.balanceOf(userAddress);
          if (balance < totalSaleAmount) {
            throw new Error(
              `Insufficient sale token balance. Required: ${ethers.formatUnits(totalSaleAmount, params.saleTokenDecimals)}`,
            );
          }
          const allowance: bigint = await saleTokenContract.allowance(
            userAddress,
            contractAddress,
          );
          if (allowance < totalSaleAmount) {
            const approveTx = await saleTokenContract.approve(
              contractAddress,
              totalSaleAmount,
            );
            await approveTx.wait();
          }
        }

        // editPool is nonpayable — no native value sent
        const tx = await contract.editPool(params.poolAddress, payload);
        const receipt = await tx.wait();

        toast.success("Launchpad pool updated!", {
          description: `Tx: ${receipt.hash}`,
        });
      } catch (error: unknown) {
        toast.error("Failed to update launchpad pool", {
          description: getErrorMessage({ error }),
        });
        throw error;
      }
    },
    [isConnected, walletProvider],
  );

  return { editPool };
};
