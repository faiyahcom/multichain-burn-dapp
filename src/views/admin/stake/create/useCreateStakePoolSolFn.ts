import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import {
    PublicKey,
    SystemProgram,
    TransactionInstruction,
} from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    getMint,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
    getStakingProgram,
    type BrowserWallet,
} from "@/web3/contracts/stakingProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getPoolPDA,
    getRewardVaultPDA,
    getDepositVaultPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
} from "@/web3/helpers";
import { toBaseUnits } from "@/utils/helpers/numbers";
import BN from "bn.js";
import { DECIMAL_FEE_PERCENT } from "../../fee-settings-management/hooks/useFeeSettings";

export type CreateStakePoolSolParams = {
    poolName: string;
    /** Mint address of the staking (deposit) token */
    stakingToken: string;
    /** Mint address of the reward token */
    rewardToken: string;
    startTime: Date;
    endTime: Date;
    /** Human-readable min staking amount */
    minStakingAmount: string;
    /** Human-readable max staking amount (0 = unlimited) */
    maxStakingAmount: string;
    /** Human-readable total staking cap */
    stakingLimit: string;
    /** Human-readable reward budget to deposit on creation */
    budget: string;
    /** Lock-up duration in days */
    lockDuration: number;
    /** Interest start delay (delay_accumulate) in days */
    interestStartDelay: number;
    /** Interest accrual duration (interest_duration) in days; null = infinite (i64::MAX on-chain) */
    interestAccrualDuration: number | null;
    /** Claim start delay (delay_claim) in days */
    claimStartDelay: number;
    /** APR as a plain percentage, e.g. 12 for 12% — stored as bps (×100) on-chain */
    apr: number;
    /** Whether to enable low reward notification */
    lowRewardNotification: boolean;
    /** When true, reward accrual stops at pool end time */
    stopAccrualAtPoolEnd: boolean;
};

export const useCreateStakePoolSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const createPool = useCallback(
        async (params: CreateStakePoolSolParams): Promise<string | undefined> => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider)
                    throw new Error("Connection not available");

                const walletPublicKey = new PublicKey(address);

                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };

                const program = getStakingProgram(connection, anchorWallet);

                const rewardMint = new PublicKey(params.rewardToken);
                const depositMint = new PublicKey(params.stakingToken);

                // 1. Detect asset types
                const assetRewardType = await detectAssetType(connection, rewardMint);
                const assetType = await detectAssetType(connection, depositMint);

                const rewardTokenProgramId =
                    getTokenProgramFromAssetType(assetRewardType);
                const depositTokenProgramId = getTokenProgramFromAssetType(assetType);

                // 2. Fetch mint decimals
                const rewardMintInfo = await getMint(
                    connection,
                    rewardMint,
                    undefined,
                    rewardTokenProgramId!,
                );
                const depositMintInfo = await getMint(
                    connection,
                    depositMint,
                    undefined,
                    depositTokenProgramId!,
                );
                const rewardDecimals = rewardMintInfo.decimals;
                const depositDecimals = depositMintInfo.decimals;

                // 3. Derive owner reward ATA
                const ownerRewardAta = await getAssociatedTokenAddress(
                    rewardMint,
                    walletPublicKey,
                    false,
                    rewardTokenProgramId!,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );

                const ataInfo = await connection.getAccountInfo(ownerRewardAta);

                // 4. Derive PDAs
                const stakingFactoryPDA = getFactoryPDA(program.programId);
                const factoryState =
                    // @ts-ignore
                    await program.account.factoryAccount.fetch(stakingFactoryPDA);
                const poolCount: BN = factoryState.poolCount;

                const poolPDA = getPoolPDA(poolCount.toNumber(), program.programId);
                const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

                // burn_factory = factory PDA of the multichain burn program (cross-program ref)
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);

                // 5. Convert amounts to base units
                const rewardAmountBN = toBaseUnits(params.budget, rewardDecimals);
                const minStakingBN = toBaseUnits(
                    params.minStakingAmount,
                    depositDecimals,
                );
                const maxStakingBN = toBaseUnits(
                    params.maxStakingAmount || "0",
                    depositDecimals,
                );
                const stakingLimitBN = toBaseUnits(
                    params.stakingLimit,
                    depositDecimals,
                );

                // 6. Convert time / duration fields
                const timeStart = new BN(Math.floor(params.startTime.getTime() / 1000));
                const timeEnd = new BN(Math.floor(params.endTime.getTime() / 1000));
                // Contract expects seconds
                const lockDurationSec = new BN(Math.round(params.lockDuration * 86400));
                const delayAccumulate = new BN(
                    Math.round(params.interestStartDelay * 86400),
                );
                const delayClaim = new BN(Math.round(params.claimStartDelay * 86400));
                const interestDuration =
                    params.interestAccrualDuration === null || params.interestAccrualDuration <= 0
                        ? new BN(0) // i64::MAX — infinite accrual until unstake
                        : new BN(Math.round(params.interestAccrualDuration * 86400));
                // APR stored as basis points: 12% → 1200 bps
                const aprBps = new BN(Math.round(params.apr * DECIMAL_FEE_PERCENT));

                // 7. Prepend ATA creation if wallet's reward ATA is missing
                const prependIxs: TransactionInstruction[] = [];
                if (!ataInfo) {
                    prependIxs.push(
                        createAssociatedTokenAccountInstruction(
                            walletPublicKey,
                            ownerRewardAta,
                            walletPublicKey,
                            rewardMint,
                            rewardTokenProgramId!,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
                        ),
                    );
                }

                // 8. Build the create_pool transaction
                const tx = await program.methods
                    .createPool({
                        projectOwner: walletPublicKey,
                        timeStart,
                        timeEnd,
                        assetType,
                        assetRewardType,
                        rewardAmount: rewardAmountBN,
                        name: params.poolName,
                        maxStakingAmount: maxStakingBN,
                        minStakingAmount: minStakingBN,
                        apr: aprBps,
                        lockDuration: lockDurationSec,
                        delayAccumulate,
                        delayClaim,
                        interestDuration,
                        stakingLimit: stakingLimitBN,
                        lowRewardNoti: params.lowRewardNotification,
                        stopAccrualAtPoolEnd: params.stopAccrualAtPoolEnd,
                    })
                    .accounts({
                        factory: stakingFactoryPDA,
                        burnFactory: burnFactoryPDA,
                        burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                        projectOwner: walletPublicKey,
                        pool: poolPDA,
                        rewardMint,
                        depositMint,
                        rewardVault: rewardVaultPDA,
                        depositVault: depositVaultPDA,
                        ownerRewardAta,
                        rewardTokenProgram: rewardTokenProgramId!,
                        depositTokenProgram: depositTokenProgramId!,
                        systemProgram: SystemProgram.programId,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    })
                    .transaction();

                if (prependIxs.length > 0) {
                    tx.instructions.unshift(...prependIxs);
                }

                // 9. Finalize, sign, send
                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();

                tx.recentBlockhash = blockhash;
                tx.feePayer = walletPublicKey;

                // Note: We use sendAndConfirmTransactionSafe which gracefully handles 
                // the "already processed" error that can occur if the wallet 
                // auto-submits on signTransaction.
                const signedTx = await provider.signTransaction(tx);
                const signature = await sendAndConfirmTransactionSafe(
                    connection,
                    signedTx.serialize(),
                    { blockhash, lastValidBlockHeight }
                );

                toast.success("Staking pool created!", {
                    description: signature,
                });

                return poolPDA.toBase58();
            } catch (error: unknown) {
                toast.error("Create staking pool failed", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    const submitPool = useCallback(
        async (poolAddress: string): Promise<void> => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider)
                    throw new Error("Connection not available");

                const walletPublicKey = new PublicKey(address);

                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };

                const program = getStakingProgram(connection, anchorWallet);

                const stakingFactoryPDA = getFactoryPDA(program.programId);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const poolPDA = new PublicKey(poolAddress);

                const tx = await program.methods
                    .submitPool()
                    .accounts({
                        admin: walletPublicKey,
                        pool: poolPDA,
                        burnFactory: burnFactoryPDA,
                        factory: stakingFactoryPDA,
                        burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                    })
                    .transaction();

                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();

                tx.recentBlockhash = blockhash;
                tx.feePayer = walletPublicKey;

                const signedTx = await provider.signTransaction(tx);
                const signature = await sendAndConfirmTransactionSafe(
                    connection,
                    signedTx.serialize(),
                    { blockhash, lastValidBlockHeight }
                );

                toast.success("Staking pool submitted for review!", {
                    description: signature,
                });
            } catch (error: unknown) {
                toast.error("Submit staking pool failed", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { createPool, submitPool };
};
