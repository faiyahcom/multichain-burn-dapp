import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "bn.js";
import {
    getMultichainBurnProgram,
    type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getRewardVaultPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import type { PoolDetailResponse } from "@/types/pool";
import { toBaseUnits } from "@/utils/helpers/numbers";

export interface DepositRewardSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    amountStr: string;
}

export const useDepositRewardSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const depositRewardSol = useCallback(
        async ({ poolAddress, poolDetail, amountStr }: DepositRewardSolParams) => {
            try {
                if (!isConnected || !address) {
                    throw new Error("Wallet not connected");
                }
                if (!connection || !provider) {
                    throw new Error("Solana connection or provider is not available");
                }

                const walletPublicKey = new PublicKey(address);

                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };

                const program = getMultichainBurnProgram(connection, anchorWallet);

                const factoryPDA = getFactoryPDA(program.programId);
                const poolPDA = new PublicKey(poolAddress);

                const { rewardTokenDecimals, assetTypeReward, rewardToken } =
                    poolDetail.pool;

                const amountBN = new BN(
                    toBaseUnits(amountStr, rewardTokenDecimals).toString(),
                );

                const isNativeReward = assetTypeReward === AssetTypeEnum.NATIVE;

                let signature: string;

                if (isNativeReward) {
                    // Contract handles native SOL transfer internally
                    const tx = await program.methods
                        .depositRewardNative(amountBN)
                        .accounts({
                            projectOwner: walletPublicKey,
                            factory: factoryPDA,
                            pool: poolPDA,
                        })
                        .transaction();

                    const { blockhash, lastValidBlockHeight } =
                        await connection.getLatestBlockhash();
                    tx.recentBlockhash = blockhash;
                    tx.feePayer = walletPublicKey;

                    const signedTx = await provider.signTransaction(tx);
                    signature = await connection.sendRawTransaction(
                        signedTx.serialize(),
                    );
                    await connection.confirmTransaction({
                        signature,
                        blockhash,
                        lastValidBlockHeight,
                    });
                } else {
                    const rewardMint = new PublicKey(rewardToken);
                    const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);

                    // Detect correct token program for the reward mint
                    const rewardAssetType = await detectAssetType(connection, rewardMint);
                    const rewardTokenProgram = getTokenProgramFromAssetType(rewardAssetType)!;

                    const ownerRewardAta = await getAssociatedTokenAddress(
                        rewardMint,
                        walletPublicKey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    const tx = await program.methods
                        .depositRewardSpl(amountBN)
                        .accounts({
                            projectOwner: walletPublicKey,
                            factory: factoryPDA,
                            pool: poolPDA,
                            rewardVault: rewardVaultPDA,
                            rewardMint,
                            ownerRewardAta,
                            rewardTokenProgram,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            systemProgram: SystemProgram.programId,
                        })
                        .transaction();

                    // Create ownerRewardAta if it doesn't exist yet
                    const ataInfo = await connection.getAccountInfo(ownerRewardAta);
                    if (!ataInfo) {
                        tx.instructions.unshift(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                ownerRewardAta,
                                walletPublicKey,
                                rewardMint,
                                rewardTokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }

                    const { blockhash, lastValidBlockHeight } =
                        await connection.getLatestBlockhash();
                    tx.recentBlockhash = blockhash;
                    tx.feePayer = walletPublicKey;

                    const signedTx = await provider.signTransaction(tx);
                    signature = await connection.sendRawTransaction(
                        signedTx.serialize(),
                    );
                    await connection.confirmTransaction({
                        signature,
                        blockhash,
                        lastValidBlockHeight,
                    });
                }

                toast.success("Reward deposited successfully!", {
                    description: `Tx: ${signature}`,
                });

                return signature;
            } catch (error: any) {
                toast.error("Failed to deposit reward", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { depositRewardSol };
};
