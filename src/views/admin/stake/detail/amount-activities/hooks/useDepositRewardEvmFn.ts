import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import {
    getContractStakeFactory,
    getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import { ZERO_ADDRESS } from "@/config/constant";

export interface DepositRewardStakeEvmParams {
    poolAddress: string;
    rewardToken: string;
    amountStr: string;
    decimals: number;
}

export const useDepositRewardEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const depositRewardEvm = useCallback(
        async ({ poolAddress, rewardToken, amountStr, decimals }: DepositRewardStakeEvmParams) => {
            try {
                if (!isConnected || !walletProvider) throw new Error("Wallet not connected");

                const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
                const signer = await provider.getSigner();
                const amount = ethers.parseUnits(amountStr, decimals);
                const isNative = rewardToken.toLowerCase() === ZERO_ADDRESS;

                const contract = getContractStakeFactory(signer);

                if (!isNative) {
                    const erc20 = getERC20Contract(rewardToken, signer);
                    const factoryAddress = ethers.getAddress(await contract.getAddress());
                    const approveTx = await erc20.approve(factoryAddress, amount);
                    await approveTx.wait();
                }

                const tx = await contract.depositReward(poolAddress, amount, {
                    value: isNative ? amount : 0n,
                });
                const receipt = await tx.wait();

                toast.success("Reward deposited successfully!", { description: `Tx: ${receipt.hash}` });
                return receipt.hash;
            } catch (error: unknown) {
                toast.error("Failed to deposit reward", { description: getErrorMessage({ error }) });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { depositRewardEvm };
};
