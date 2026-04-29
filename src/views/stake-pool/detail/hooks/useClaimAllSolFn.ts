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
    getStakeEntryPDA,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
    type AssetType,
} from "@/web3/helpers";

export interface ClaimAllSolParams {
    /** Pool PDA address */
    poolAddress: string;
    /** Stake indices to claim rewards for */
    stakeIds: number[];
    /** Reward token mint address */
    rewardMint: string;
    /** Asset type of the reward token (from poolDetail.pool.assetTypeReward) */
    assetTypeReward: number;
}

// Iterates over all provided stakeIds and claims each reward in sequence.
export const useClaimAllSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const claimAllSol = useCallback(
        async ({
            poolAddress,
            stakeIds,
            rewardMint,
            assetTypeReward,
        }: ClaimAllSolParams): Promise<string | undefined> => {
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
                const rewardMintPK = new PublicKey(rewardMint);
                const isNativeReward = (assetTypeReward as AssetType) === AssetTypeEnum.NATIVE;
                const rewardTokenProgram = getTokenProgramFromAssetType(assetTypeReward as AssetType)!;

                const factoryPDA = getFactoryPDA(program.programId);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);

                // @ts-ignore
                const factoryState = await programBurn.account.factoryAccount.fetch(burnFactoryPDA);
                const treasury = factoryState.treasury as PublicKey;

                // For SPL reward: ensure the user reward ATA exists.
                // If it doesn't, prepend the creation instruction to the first claim tx.
                let userTokenAta: PublicKey | undefined;
                let rewardVaultPDA: PublicKey | undefined;
                let treasuryTokenAta: PublicKey | undefined;
                let ataCreateIx: TransactionInstruction | undefined;
                if (!isNativeReward) {
                    rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                    userTokenAta = await getAssociatedTokenAddress(
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
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );
                    const ataInfo = await connection.getAccountInfo(userTokenAta);
                    if (!ataInfo) {
                        ataCreateIx = createAssociatedTokenAccountInstruction(
                            walletPublicKey,
                            userTokenAta,
                            walletPublicKey,
                            rewardMintPK,
                            rewardTokenProgram,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
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

                    const { blockhash, lastValidBlockHeight } =
                        await connection.getLatestBlockhash();

                    let tx: Transaction;
                    if (isNativeReward) {
                        tx = await program.methods
                            .claimRewardNative()
                            .accounts({
                                user: walletPublicKey,
                                burnFactory: burnFactoryPDA,
                                burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                                treasury,
                                pool: poolPDA,
                                factory: factoryPDA,
                                stakeEntry: stakeEntryPDA,
                                systemProgram: SystemProgram.programId,
                            })
                            .transaction();
                    } else {
                        tx = await program.methods
                            .claimReward()
                            .accounts({
                                user: walletPublicKey,
                                burnFactory: burnFactoryPDA,
                                burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                                treasury,
                                treasuryTokenAta: treasuryTokenAta!,
                                pool: poolPDA,
                                factory: factoryPDA,
                                rewardMint: rewardMintPK,
                                rewardVault: rewardVaultPDA!,
                                userTokenAta: userTokenAta!,
                                stakeEntry: stakeEntryPDA,
                                tokenProgram: rewardTokenProgram,
                                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                                systemProgram: SystemProgram.programId,
                            })
                            .transaction();
                        // Prepend ATA creation to the first tx if needed
                        if (isFirstTx && ataCreateIx) {
                            tx.instructions.unshift(ataCreateIx);
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

                toast.success("All rewards claimed!", { description: lastSignature });
                return lastSignature;
            } catch (error: unknown) {
                toast.error("Failed to claim rewards", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { claimAllSol };
};
