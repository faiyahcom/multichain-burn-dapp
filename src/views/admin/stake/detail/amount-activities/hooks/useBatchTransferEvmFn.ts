import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { ethers, type Eip1193Provider } from "ethers";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    getContractStakeFactory,
    getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import type { PoolDetailResponse } from "@/types/pool";
import type { BatchRecipient, TokenMode } from "./useBatchTransferSolFn";
import { getErrorMessage } from "@/utils/helpers/error-message";

export interface BatchTransferStakeEvmParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    mode: TokenMode;
    recipients: BatchRecipient[];
    onSuccess?: (txHash: string) => void;
}

export const useBatchTransferEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const batchTransferEvm = useCallback(
        async ({ poolAddress, poolDetail, mode, recipients, onSuccess }: BatchTransferStakeEvmParams) => {
            try {
                if (!isConnected || !walletProvider) throw new Error("Wallet not connected");

                const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
                const signer = await provider.getSigner();

                const pool = poolDetail.pool;
                const tokenAddress = mode === "reward" ? pool.rewardToken : pool.tokenIn;
                const decimals = mode === "reward" ? pool.rewardTokenDecimals : pool.tokenInDecimals;

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
                    const [whole, frac = ""] = r.amountStr.split(".");
                    const truncated = frac.length > tokenDecimals
                        ? `${whole}.${frac.slice(0, tokenDecimals)}`
                        : r.amountStr;
                    return ethers.parseUnits(truncated, tokenDecimals);
                });

                // Check pool balance
                let balance = BigInt(0);
                if (tokenAddress === "0x0000000000000000000000000000000000000000") {
                    balance = await provider.getBalance(poolAddress);
                } else {
                    const erc20 = getERC20Contract(tokenAddress, signer);
                    balance = await erc20.balanceOf(poolAddress);
                }

                if (balance < amounts.reduce((a, b) => a + b, BigInt(0))) {
                    throw new Error("Total requested exceeds vault balance");
                }

                // Staking EVM: emergencyWithdraw(pool, token, tos[], amounts[])
                const contract = getContractStakeFactory(signer);
                const tx = await contract.emergencyWithdraw(poolAddress, tokenAddress, tos, amounts);
                const receipt = await tx.wait();

                toast.success(
                    `${mode === "reward" ? "Reward" : "Staking"} tokens sent to ${validRecipients.length} recipient${validRecipients.length > 1 ? "s" : ""}!`,
                    { description: `Tx: ${receipt?.hash}` },
                );

                if (receipt?.hash) onSuccess?.(receipt.hash);
                return receipt?.hash;
            } catch (error: unknown) {
                toast.error("Failed to transfer tokens", { description: getErrorMessage({ error }) });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { batchTransferEvm };
};
