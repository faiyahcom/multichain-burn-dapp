import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import {
    PublicKey,
    SystemProgram,
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
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getRewardVaultPDA,
    getStakeEntryPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";

export interface ClaimRewardSolParams {
    /** Pool PDA address */
    poolAddress: string;
    /** Stake index / stakeId */
    stakeId: number;
    /** Reward token mint address */
    rewardMint: string;
}

export const useClaimRewardSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const claimRewardSol = useCallback(
        async ({
            poolAddress,
            stakeId,
            rewardMint,
        }: ClaimRewardSolParams): Promise<string | undefined> => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider) throw new Error("Connection not available");

                const walletPublicKey = new PublicKey(address);
                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };
                const program = getStakingProgram(connection, anchorWallet);

                const poolPDA = new PublicKey(poolAddress);
                const rewardMintPK = new PublicKey(rewardMint);
                const rewardAssetType = await detectAssetType(connection, rewardMintPK);
                const isNativeReward = rewardAssetType === AssetTypeEnum.NATIVE;
                const rewardTokenProgram = getTokenProgramFromAssetType(rewardAssetType)!;

                const factoryPDA = getFactoryPDA(program.programId);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const stakeEntryPDA = getStakeEntryPDA(
                    poolPDA,
                    walletPublicKey,
                    stakeId,
                    program.programId,
                );

                // Fetch factory to get treasury address
                // @ts-ignore
                const factoryState = await program.account.factoryAccount.fetch(factoryPDA);
                const treasury = factoryState.treasury as PublicKey;

                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();

                let signature: string;

                if (isNativeReward) {
                    const tx = await program.methods
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

                    tx.recentBlockhash = blockhash;
                    tx.feePayer = walletPublicKey;
                    const signedTx = await provider.signTransaction(tx);
                    signature = await sendAndConfirmTransactionSafe(
                        connection,
                        signedTx.serialize(),
                        { blockhash, lastValidBlockHeight },
                    );
                } else {
                    const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                    const userTokenAta = await getAssociatedTokenAddress(
                        rewardMintPK,
                        walletPublicKey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    const prependIxs: TransactionInstruction[] = [];
                    const ataInfo = await connection.getAccountInfo(userTokenAta);
                    if (!ataInfo) {
                        prependIxs.push(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                userTokenAta,
                                walletPublicKey,
                                rewardMintPK,
                                rewardTokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }

                    const tx = await program.methods
                        .claimReward()
                        .accounts({
                            user: walletPublicKey,
                            burnFactory: burnFactoryPDA,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                            treasury,
                            pool: poolPDA,
                            factory: factoryPDA,
                            rewardMint: rewardMintPK,
                            rewardVault: rewardVaultPDA,
                            userTokenAta,
                            stakeEntry: stakeEntryPDA,
                            tokenProgram: rewardTokenProgram,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            systemProgram: SystemProgram.programId,
                        })
                        .transaction();

                    if (prependIxs.length > 0) tx.instructions.unshift(...prependIxs);

                    tx.recentBlockhash = blockhash;
                    tx.feePayer = walletPublicKey;
                    const signedTx = await provider.signTransaction(tx);
                    signature = await sendAndConfirmTransactionSafe(
                        connection,
                        signedTx.serialize(),
                        { blockhash, lastValidBlockHeight },
                    );
                }

                toast.success("Reward claimed successfully!", { description: signature });
                return signature;
            } catch (error: unknown) {
                toast.error("Failed to claim reward", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { claimRewardSol };
};
