import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import {
    getContractLaunchpadFactory,
    getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import { ZERO_ADDRESS } from "@/config/constant";
import { getErrorMessage } from "@/utils/helpers/error-message";

export interface DepositLaunchpadParams {
    poolAddress: string;
    paymentToken: string;
    amountStr: string;
    decimals: number;
}

export const useDepositLaunchpadEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const depositLaunchpadEvm = useCallback(
        async ({ poolAddress, paymentToken, amountStr, decimals }: DepositLaunchpadParams) => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();
                const amount = ethers.parseUnits(amountStr, decimals);
                const isNative = paymentToken.toLowerCase() === ZERO_ADDRESS;
                const txValue = isNative ? amount : 0n;

                const contract = getContractLaunchpadFactory(signer);

                if (!isNative) {
                    const erc20 = getERC20Contract(paymentToken, signer);
                    const factoryAddress = ethers.getAddress(await contract.getAddress());
                    const approveTx = await erc20.approve(factoryAddress, amount);
                    await approveTx.wait();
                }

                const tx = await contract.deposit(poolAddress, amount, { value: txValue });
                const receipt = await tx.wait();

                toast.success("Deposited successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash as string;
            } catch (error: unknown) {
                const message = getErrorMessage({ error });
                toast.error("Failed to deposit", {
                    description: message,
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { depositLaunchpadEvm };
};
