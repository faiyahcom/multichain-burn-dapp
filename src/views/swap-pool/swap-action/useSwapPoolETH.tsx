import { useCallback } from "react";
import { toast } from "sonner";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import {
    getContractSwapRouter,
    getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";

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
            const routerContract = getContractSwapRouter(signer);

            const parsedAmount = ethers.parseUnits(amountIn, decimals);

            const tokenContract = getERC20Contract(tokenInAddress, signer);
            const approveTx = await tokenContract.approve(poolAddress, parsedAmount);
            const approveTxReceipt = await approveTx.wait();
            console.log("approveTxReceipt", approveTxReceipt);

            console.log({
                poolAddress,
                parsedAmount,
            });

            const tx = await routerContract.depositSwapPool(
                poolAddress,
                parsedAmount,
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
