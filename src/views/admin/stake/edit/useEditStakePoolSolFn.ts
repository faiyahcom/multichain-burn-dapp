import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useAppKitConnection, type Provider } from "@reown/appkit-adapter-solana/react";
import { getStakingProgram, type BrowserWallet } from "@/web3/contracts/stakingProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import { getFactoryPDA } from "@/web3/helpers";
import { toBaseUnits } from "@/utils/helpers/numbers";
import { DECIMAL_FEE_PERCENT } from "../../fee-settings-management/hooks/useFeeSettings";

export interface EditStakePoolSolParams {
    poolAddress: string;
    /** Pool name string */
    name: string;
    /** Unix seconds */
    timeStart: number;
    /** Unix seconds */
    timeEnd: number;
    /** Human-readable min staking amount per tx */
    minStakingAmount: string;
    /** Human-readable max staking amount per tx (0 = unlimited) */
    maxStakingAmount: string;
    /** Human-readable total staking cap (0 = unlimited) */
    stakingLimit: string;
    /** Lock-up duration in days */
    lockDuration: number;
    /** Interest start delay (delay_accumulate) in days */
    interestStartDelay: number;
    /** Interest accrual duration (interest_duration) in days; null / 0 = infinite (uses 0 on-chain) */
    interestAccrualDuration: number | null;
    /** Claim start delay in days */
    claimStartDelay: number;
    /** APR as plain percentage, e.g. 12 for 12% */
    apr: number;
    /** Decimals of the staking (deposit) token */
    tokenInDecimals: number;
}

export const useEditStakePoolSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const editPool = useCallback(
        async (params: EditStakePoolSolParams): Promise<string | undefined> => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider) throw new Error("Solana connection or provider is not available");

                const walletPublicKey = new PublicKey(address);

                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };

                const program = getStakingProgram(connection, anchorWallet);
                const poolPDA = new PublicKey(params.poolAddress);
                const factoryPDA = getFactoryPDA(program.programId);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);

                const dec = params.tokenInDecimals;
                const minStakingBN = toBaseUnits(params.minStakingAmount || "0", dec);
                const maxStakingBN = toBaseUnits(params.maxStakingAmount || "0", dec);
                const stakingLimitBN = toBaseUnits(params.stakingLimit || "0", dec);
                const aprBps = new BN(Math.round(params.apr * DECIMAL_FEE_PERCENT));
                const lockDurationSec = new BN(Math.round(params.lockDuration * 86400));
                const delayAccumulate = new BN(Math.round(params.interestStartDelay * 86400));
                const delayClaim = new BN(Math.round(params.claimStartDelay * 86400));
                const interestDuration =
                    params.interestAccrualDuration === null || params.interestAccrualDuration <= 0
                        ? new BN(0)
                        : new BN(Math.round(params.interestAccrualDuration * 86400));

                const tx = await program.methods
                    .updatePool({
                        timeStart: new BN(params.timeStart),
                        timeEnd: new BN(params.timeEnd),
                        name: params.name,
                        maxStakingAmount: maxStakingBN,
                        minStakingAmount: minStakingBN,
                        stakingLimit: stakingLimitBN,
                        apr: aprBps,
                        lockDuration: lockDurationSec,
                        delayAccumulate,
                        delayClaim,
                        interestDuration,
                    })
                    .accounts({
                        admin: walletPublicKey,
                        pool: poolPDA,
                        factory: factoryPDA,
                        burnFactory: burnFactoryPDA,
                        burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                    })
                    .transaction();

                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.feePayer = walletPublicKey;

                const signedTx = await provider.signTransaction(tx);
                const signature = await sendAndConfirmTransactionSafe(
                    connection,
                    signedTx.serialize(),
                    { blockhash, lastValidBlockHeight },
                );

                toast.success("Pool updated successfully!", { description: `Tx: ${signature}` });
                return signature;
            } catch (error: unknown) {
                toast.error("Failed to update pool", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { editPool };
};
