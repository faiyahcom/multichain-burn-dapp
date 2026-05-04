import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import {
    PublicKey,
    SystemProgram,
    Transaction,
    type TransactionInstruction,
} from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
    getStakingProgram,
    type BrowserWallet,
} from "@/web3/contracts/stakingProgramSol";
import { getMultichainBurnProgram, MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getRewardVaultPDA,
    getDepositVaultPDA,
    getUserStakeTrackerPDA,
    getStakeEntryPDA,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
    type AssetType,
} from "@/web3/helpers";
import BN from "bn.js";

export interface UnstakeAllSolParams {
    /** Pool PDA address */
    poolAddress: string;
    /** Stake indices to unstake */
    stakeIds: number[];
    /** Staking (deposit) token mint address */
    depositMint: string;
    /** Asset type of the deposit token (from poolDetail.pool.assetTypeIn) */
    assetTypeIn: number;
    /** Reward token mint address */
    rewardMint: string;
    /** Asset type of the reward token (from poolDetail.pool.assetTypeReward) */
    assetTypeReward: number;
}

// Iterates over all provided stakeIds and unstakes each in sequence.
export const useUnstakeAllSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const unstakeAllSol = useCallback(
        async ({
            poolAddress,
            stakeIds,
            depositMint,
            assetTypeIn,
            rewardMint,
            assetTypeReward,
        }: UnstakeAllSolParams): Promise<string | undefined> => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider) throw new Error("Connection not available");
                if (!stakeIds.length) return;

                const walletPublicKey = new PublicKey(address);
                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };
                const program = getStakingProgram(connection, anchorWallet);
                const programBurn = getMultichainBurnProgram(connection, anchorWallet);

                const poolPDA = new PublicKey(poolAddress);
                const depositMintPK = new PublicKey(depositMint);
                const rewardMintPK = new PublicKey(rewardMint);

                const isNativeDeposit = (assetTypeIn as AssetType) === AssetTypeEnum.NATIVE;
                const depositTokenProgram = getTokenProgramFromAssetType(assetTypeIn as AssetType)!;
                const rewardTokenProgram = getTokenProgramFromAssetType(assetTypeReward as AssetType)!;

                const factoryPDA = getFactoryPDA(program.programId);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const userStakeTrackerPDA = getUserStakeTrackerPDA(
                    poolPDA,
                    walletPublicKey,
                    program.programId,
                );

                // @ts-ignore
                const factoryState = await programBurn.account.factoryAccount.fetch(burnFactoryPDA);
                const treasury = factoryState.treasury as PublicKey;

                // For SPL: pre-derive ATAs and collect any missing-ATA creation ixs.
                let userTokenAta: PublicKey | undefined;
                let userRewardAta: PublicKey | undefined;
                let rewardVaultPDA: PublicKey | undefined;
                let depositVaultPDA: PublicKey | undefined;
                let treasuryTokenAta: PublicKey | undefined;
                const prependFirstIxs: TransactionInstruction[] = [];

                if (!isNativeDeposit) {
                    rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                    depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

                    userTokenAta = await getAssociatedTokenAddress(
                        depositMintPK,
                        walletPublicKey,
                        false,
                        depositTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );
                    userRewardAta = await getAssociatedTokenAddress(
                        rewardMintPK,
                        walletPublicKey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );
                    treasuryTokenAta = await getAssociatedTokenAddress(
                        rewardMintPK,
                        treasury,
                        true,
                        depositTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    const [depositAtaInfo, rewardAtaInfo] = await Promise.all([
                        connection.getAccountInfo(userTokenAta),
                        connection.getAccountInfo(userRewardAta),
                    ]);
                    if (!depositAtaInfo) {
                        prependFirstIxs.push(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                userTokenAta,
                                walletPublicKey,
                                depositMintPK,
                                depositTokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }
                    if (!rewardAtaInfo) {
                        prependFirstIxs.push(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                userRewardAta,
                                walletPublicKey,
                                rewardMintPK,
                                rewardTokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }
                }

                let lastSignature: string | undefined;
                let isFirstTx = true;

                for (const stakeId of stakeIds) {
                    const stakeEntryPDA = getStakeEntryPDA(
                        poolPDA,
                        walletPublicKey,
                        stakeId,
                        program.programId,
                    );

                    // Fetch staked amount — the unstake instruction requires it explicitly
                    // @ts-ignore
                    const stakeEntryState = await program.account.stakeEntry.fetch(
                        stakeEntryPDA,
                    );
                    const amount = stakeEntryState.amount as BN;

                    const { blockhash, lastValidBlockHeight } =
                        await connection.getLatestBlockhash();

                    let tx: Transaction;
                    if (isNativeDeposit) {
                        tx = await program.methods
                            .unstakeNative(amount)
                            .accounts({
                                user: walletPublicKey,
                                pool: poolPDA,
                                factory: factoryPDA,
                                treasury,
                                userStakeTracker: userStakeTrackerPDA,
                                stakeEntry: stakeEntryPDA,
                                systemProgram: SystemProgram.programId,
                                burnFactory: burnFactoryPDA,
                                burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                            })
                            .transaction();
                    } else {
                        tx = await program.methods
                            .unstake(amount)
                            .accounts({
                                user: walletPublicKey,
                                pool: poolPDA,
                                factory: factoryPDA,
                                depositMint: depositMintPK,
                                rewardMint: rewardMintPK,
                                treasury,
                                treasuryTokenAta: treasuryTokenAta!,
                                rewardVault: rewardVaultPDA!,
                                depositVault: depositVaultPDA!,
                                userTokenAta: userTokenAta!,
                                userRewardAta: userRewardAta!,
                                userStakeTracker: userStakeTrackerPDA,
                                stakeEntry: stakeEntryPDA,
                                tokenProgram: depositTokenProgram,
                                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                                systemProgram: SystemProgram.programId,
                                burnFactory: burnFactoryPDA,
                                burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                            })
                            .transaction();
                        // Prepend ATA creation ixs to the first tx if needed
                        if (isFirstTx && prependFirstIxs.length > 0) {
                            tx.instructions.unshift(...prependFirstIxs);
                        }
                    }

                    isFirstTx = false;
                    tx.recentBlockhash = blockhash;
                    tx.feePayer = walletPublicKey;
                    const signedTx = await provider.signTransaction(tx);
                    lastSignature = await sendAndConfirmTransactionSafe(
                        connection,
                        signedTx.serialize(),
                        { blockhash, lastValidBlockHeight },
                    );
                }

                toast.success("Unstaked all successfully!", { description: lastSignature });
                return lastSignature;
            } catch (error: unknown) {
                toast.error("Failed to unstake", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { unstakeAllSol };
};
