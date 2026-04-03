import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractSwapFactory } from "@/web3/contracts/multichainBurnContractEVM";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { DECIMAL_FEE_PERCENT } from "./useFeeSettings";

export type UpdateFeeConfigEvmParams = {
    treasury: string;
    /** Human-readable native amount, e.g. "0.01" for 0.01 ETH */
    creationFee: string;
    /** Percentage, e.g. "5" for 5% (stored as 500 bps on-chain) */
    settlementFee: string;
};

export const useUpdateFeeConfigEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const updateFeeConfigEvm = useCallback(
        async ({ treasury, creationFee, settlementFee }: UpdateFeeConfigEvmParams) => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();
                const contract = getContractSwapFactory(signer);

                // creationFee: human ETH/BNB/XPT → wei
                const creationFeeWei = ethers.parseEther(creationFee);
                // settlementFee: percentage → basis points (e.g. 5% → 500)
                const settlementFeeBps = BigInt(Math.round(parseFloat(settlementFee) * DECIMAL_FEE_PERCENT));

                const tx = await contract.setFeeConfig(
                    treasury,
                    creationFeeWei,
                    settlementFeeBps,
                );
                const receipt = await tx.wait();

                toast.success("Fee config updated successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash as string;
            } catch (error: any) {
                toast.error("Failed to update fee config", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { updateFeeConfigEvm };
};
