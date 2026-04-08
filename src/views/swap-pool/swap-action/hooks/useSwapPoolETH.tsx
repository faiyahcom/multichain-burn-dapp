import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import {
  getContractSwapRouter,
  getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import { ZERO_ADDRESS } from "@/config/constant";
import { estimateEvmTransactionFee } from "@/utils/helpers/evm-gas";

type DepositSwapPoolParams = {
  poolAddress: string;
  amountIn: string; // never use number for money
  decimals: number; // dynamic decimals
  tokenInAddress: string;
};

export type EstimateSwapPoolNetworkFeeResult = {
  nativeDecimals: number;
  nativeSymbol: string;
  steps: Array<{
    type: "approve" | "swap";
    gasCost: bigint;
    gasLimit: bigint;
  }>;
  totalGasCost: bigint;
};

const isNativeToken = (tokenAddress: string) =>
  !tokenAddress ||
  tokenAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase() ||
  tokenAddress.toLowerCase() === "native";

export const useSwapPoolETH = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const estimateSwapPoolNetworkFee = useCallback(
    async ({
      poolAddress,
      amountIn,
      decimals,
      tokenInAddress,
    }: DepositSwapPoolParams): Promise<EstimateSwapPoolNetworkFeeResult> => {
      if (!isConnected || !walletProvider) {
        throw new Error("Wallet not connected");
      }

      const provider = new ethers.BrowserProvider(
        walletProvider as Eip1193Provider,
      );
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const routerContract = getContractSwapRouter(signer);
      const parsedAmount = ethers.parseUnits(amountIn, decimals);
      const nativeDeposit = isNativeToken(tokenInAddress);
      const steps: EstimateSwapPoolNetworkFeeResult["steps"] = [];

      const estimateStep = async ({
        type,
        estimateGas,
      }: {
        type: "approve" | "swap";
        estimateGas: () => Promise<bigint>;
      }) => {
        const estimate = await estimateEvmTransactionFee({
          provider,
          estimateGas,
        });

        steps.push({
          type,
          gasCost: estimate.gasCost,
          gasLimit: estimate.gasLimit,
        });

        return estimate;
      };

      let nativeSymbol: string | undefined;
      let nativeDecimals: number | undefined;

      if (!nativeDeposit) {
        const tokenContract = getERC20Contract(tokenInAddress, signer);
        const allowance = await tokenContract.allowance(
          userAddress,
          poolAddress,
        );
        const approvalRequired = allowance < parsedAmount;

        if (approvalRequired) {
          const approvalEstimate = await estimateStep({
            type: "approve",
            estimateGas: () =>
              tokenContract.approve.estimateGas(poolAddress, parsedAmount),
          });

          nativeSymbol = approvalEstimate.nativeSymbol;
          nativeDecimals = approvalEstimate.nativeDecimals;
        }
      }

      try {
        const swapEstimate = await estimateStep({
          type: "swap",
          estimateGas: () =>
            routerContract.depositSwapPool.estimateGas(
              poolAddress,
              parsedAmount,
              {
                value: nativeDeposit ? parsedAmount : 0n,
              },
            ),
        });

        nativeSymbol = swapEstimate.nativeSymbol;
        nativeDecimals = swapEstimate.nativeDecimals;
      } catch (error) {
        if (!steps.some(({ type }) => type === "approve")) {
          throw error;
        }
      }

      if (!nativeSymbol || nativeDecimals == null) {
        throw new Error("Unable to estimate gas fee for this transaction.");
      }

      return {
        nativeDecimals,
        nativeSymbol,
        steps,
        totalGasCost: steps.reduce((total, step) => total + step.gasCost, 0n),
      };
    },
    [isConnected, walletProvider],
  );

  const depositSwapPool = useCallback(
    async ({
      poolAddress,
      amountIn,
      decimals,
      tokenInAddress,
    }: DepositSwapPoolParams) => {
      if (!isConnected || !walletProvider) {
        throw new Error("Wallet not connected");
      }

      const provider = new ethers.BrowserProvider(
        walletProvider as Eip1193Provider,
      );

      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const routerContract = getContractSwapRouter(signer);
      const parsedAmount = ethers.parseUnits(amountIn, decimals);

      const isNative = isNativeToken(tokenInAddress);

      if (!isNative) {
        const tokenContract = getERC20Contract(tokenInAddress, signer);
        const tokenBalance = await tokenContract.balanceOf(userAddress);

        if (tokenBalance < parsedAmount) {
          throw new Error(
            `Insufficient token balance. Required: ${ethers.formatUnits(parsedAmount, decimals)}, Available: ${ethers.formatUnits(tokenBalance, decimals)}`,
          );
        }

        const approveTx = await tokenContract.approve(
          poolAddress,
          parsedAmount,
        );
        await approveTx.wait();
      }

      const tx = await routerContract.depositSwapPool(
        poolAddress,
        parsedAmount,
        {
          value: isNative ? parsedAmount : 0n,
        },
      );

      const receipt = await tx.wait();

      toast.success("Deposit to swap pool successfully!", {
        description: `Tx: ${receipt.hash}`,
      });

      return receipt;
    },
    [isConnected, walletProvider],
  );

  return { depositSwapPool, estimateSwapPoolNetworkFee };
};
