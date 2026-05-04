import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractStakeFactory } from "@/web3/contracts/multichainBurnContractEVM";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { DECIMAL_FEE_PERCENT } from "../../fee-settings-management/hooks/useFeeSettings";

export interface EditStakePoolEvmParams {
    poolAddress: string;
    /** Pool name (max 31 UTF-8 bytes) */
    name: string;
    /** Unix seconds */
    startTime: number;
    /** Unix seconds */
    endTime: number;
    /** Human-readable min staking amount per tx */
    minStakingAmount: string;
    /** Human-readable max staking amount per tx (0 = unlimited) */
    maxStakingAmount: string;
    /** Human-readable total staking cap (0 = unlimited) */
    stakingLimit: string;
    /** Lock-up (unstake) duration in days */
    lockDuration: number;
    /** Interest start delay in days */
    interestStartDelay: number;
    /** Interest accrual duration in days; null / 0 = infinite */
    interestAccrualDuration: number | null;
    /** Claim start delay in days */
    claimStartDelay: number;
    /** APR as plain percentage, e.g. 12 for 12% */
    apr: number;
    /** Decimals of the staking (deposit) token */
    tokenInDecimals: number;
    /** When true, interest calculation stops at the pool's end time */
    stopAccrualAtPoolEnd: boolean;
}

const daysToSeconds = (days: number): bigint => BigInt(Math.round(days * 86400));

export const useEditStakePoolEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const editPool = useCallback(
        async (params: EditStakePoolEvmParams): Promise<string | undefined> => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
                const signer = await provider.getSigner();
                const contract = getContractStakeFactory(signer);

                const dec = params.tokenInDecimals;

                const payload = {
                    name: ethers.encodeBytes32String(params.name.slice(0, 31)),
                    startTime: BigInt(params.startTime),
                    endTime: BigInt(params.endTime),
                    minStakePerTx: ethers.parseUnits(params.minStakingAmount || "0", dec),
                    maxStakePerTx: ethers.parseUnits(params.maxStakingAmount || "0", dec),
                    stakingLimit: ethers.parseUnits(params.stakingLimit || "0", dec),
                    unstakeDelay: daysToSeconds(params.lockDuration),
                    interestDelay: daysToSeconds(params.interestStartDelay),
                    interestTime:
                        params.interestAccrualDuration === null || params.interestAccrualDuration <= 0
                            ? 0n
                            : daysToSeconds(params.interestAccrualDuration),
                    claimDelay: daysToSeconds(params.claimStartDelay),
                    apr: BigInt(Math.round(params.apr * DECIMAL_FEE_PERCENT)),
                    stopInterestAtPoolEnd: params.stopAccrualAtPoolEnd,
                };

                const tx = await contract.editPool(params.poolAddress, payload);
                const receipt = await tx.wait();

                toast.success("Pool updated successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash as string;
            } catch (error: unknown) {
                toast.error("Failed to update pool", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { editPool };
};
