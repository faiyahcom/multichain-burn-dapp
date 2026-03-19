import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import {
  getContractSwapRouter,
  getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import { ZERO_ADDRESS } from "@/config/constant";

type DepositSwapPoolParams = {
  poolAddress: string;
  amountIn: string; // never use number for money
  decimals: number; // dynamic decimals
  tokenInAddress: string;
};

export const useSwapPoolETH = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

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

      const isNative =
        !tokenInAddress ||
        tokenInAddress.toLowerCase() === ZERO_ADDRESS.toLowerCase() ||
        tokenInAddress.toLowerCase() === "native";

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

  return { depositSwapPool };
};
