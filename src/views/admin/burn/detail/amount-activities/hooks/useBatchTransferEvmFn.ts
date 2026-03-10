import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { ethers, type Eip1193Provider } from "ethers";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    getContractBurnFactory,
    getContractSwapFactory,
} from "@/web3/contracts/multichainBurnContractEVM";
import type { PoolDetailResponse } from "@/types/pool";
import type { BatchRecipient, TokenMode } from "./useBatchTransferSolFn";
import { getErrorMessage } from "@/utils/helpers/error-message";

export interface BatchTransferEvmParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    mode: TokenMode;
    recipients: BatchRecipient[];
}

export const useBatchTransferEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const batchTransferEvm = useCallback(
        async ({ poolAddress, poolDetail, mode, recipients }: BatchTransferEvmParams) => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
                const signer = await provider.getSigner();

                const pool = poolDetail.pool;
                const isSwapPool = pool.kind === 1; // 1 = swap_pool, 0 = burn_pool

                // Determine the token address and its decimals based on mode
                const tokenAddress = mode === "reward" ? pool.rewardToken : pool.tokenIn;
                const decimals = mode === "reward" ? pool.rewardTokenDecimals : pool.tokenInDecimals;

                // Filter valid recipients and convert human amounts → raw uint256
                const validRecipients = recipients.filter((r) => {
                    const amt = parseFloat(r.amountStr);
                    return amt && amt > 0;
                });

                if (validRecipients.length === 0) {
                    throw new Error("No valid transfer instructions. Make sure amounts are greater than 0.");
                }

                const tos: string[] = validRecipients.map((r) => r.address);
                const tokenDecimals = decimals ?? 18;
                const amounts: bigint[] = validRecipients.map((r) => {
                    // Truncate input to the token's decimal precision to
                    // avoid ethers "too many decimals" RangeError.
                    const [whole, frac = ""] = r.amountStr.split(".");
                    const truncated = frac.length > tokenDecimals
                        ? `${whole}.${frac.slice(0, tokenDecimals)}`
                        : r.amountStr;
                    return ethers.parseUnits(truncated, tokenDecimals);
                });

                let receipt: ethers.TransactionReceipt | null;

                if (isSwapPool) {
                    // ── Swap pool: adminWithdrawBatchSwapPool(pool, tos[], amounts[]) ──
                    const contract = getContractSwapFactory(signer);
                    const tx = await contract.adminWithdrawBatchSwapPool(poolAddress, tos, amounts);
                    receipt = await tx.wait();
                } else {
                    // ── Burn pool: emergencyWithdrawal(pool, token, tos[], amounts[]) ──
                    const contract = getContractBurnFactory(signer);
                    const tx = await contract.emergencyWithdrawal(poolAddress, tokenAddress, tos, amounts);
                    receipt = await tx.wait();
                }

                toast.success(
                    `${mode === "reward" ? "Reward" : "Deposit"} tokens sent to ${validRecipients.length} recipient${validRecipients.length > 1 ? "s" : ""}!`,
                    { description: `Tx: ${receipt?.hash}` },
                );

                return receipt?.hash;
            } catch (error: any) {
                toast.error("Failed to transfer tokens", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { batchTransferEvm };
};
