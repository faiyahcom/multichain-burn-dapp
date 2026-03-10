import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import {
    getContractBurnRouter,
    getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import { MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_BURN_ADDRESS } from "@/web3";
import { ZERO_ADDRESS } from "@/config/constant";
import { getErrorMessage } from "@/utils/helpers/error-message";

export interface DepositBurnParams {
    poolAddress: string;
    burnToken: string;
    amountStr: string;
    decimals: number;
}

export const useDepositBurnEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const depositBurnEvm = useCallback(
        async ({ poolAddress, burnToken, amountStr, decimals }: DepositBurnParams) => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();
                const amount = ethers.parseUnits(amountStr, decimals);
                const isNative =
                    burnToken.toLowerCase() === ZERO_ADDRESS;

                if (!isNative) {
                    const erc20 = getERC20Contract(burnToken, signer);
                    const routerAddress = ethers.getAddress(
                        MULTICHAIN_BURN_PROGRAM_EVM_ROUTER_BURN_ADDRESS.toLowerCase(),
                    );
                    const approveTx = await erc20.approve(routerAddress, amount);
                    await approveTx.wait();
                }

                const contract = getContractBurnRouter(signer);
                const tx = await contract.deposit(poolAddress, amount, {
                    value: isNative ? amount : 0n,
                });
                const receipt = await tx.wait();

                toast.success("Deposit successful!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash;
            } catch (error: any) {
                toast.error("Failed to deposit", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { depositBurnEvm };
};
