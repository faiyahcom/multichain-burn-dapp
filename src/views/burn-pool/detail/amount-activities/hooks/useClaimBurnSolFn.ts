import { useCallback } from "react";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
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
    getUserDepositPDA,
    detectAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import type { PoolDetailResponse } from "@/types/pool";

export interface ClaimBurnSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    /** Merkle proof bytes — pass empty array / omit if no whitelist */
    proof?: Uint8Array;
    /** Merkle leaf index — defaults to 0 */
    index?: number;
}

export const useClaimBurnSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const claimBurnSol = useCallback(
        async ({
            poolAddress,
            poolDetail,
            proof = new Uint8Array(),
            index = 0,
        }: ClaimBurnSolParams) => {
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

                // ── 1. PDAs ────────────────────────────────────────────────
                const factoryPDA = getFactoryPDA(program.programId);
                // @ts-ignore
                const factory = await program.account.factoryAccount.fetch(factoryPDA);
                const treasuryPubkey = factory.treasury;

                const poolPDA = new PublicKey(poolAddress);
                const userDepositPDA = getUserDepositPDA(
                    poolPDA,
                    walletPublicKey,
                    program.programId,
                );

                // ── 2. Proof args ──────────────────────────────────────────
                const proofBuffer = Buffer.from(proof);
                const indexBN = new BN(index);

                const isNativeReward =
                    poolDetail.pool.assetTypeReward === AssetTypeEnum.NATIVE;

                let signature: string;

                if (isNativeReward) {
                    // ── claim_reward_native ─────────────────────────────────
                    const tx = await program.methods
                        .claimRewardNative(proofBuffer, indexBN)
                        .accounts({
                            user: walletPublicKey,
                            treasury: treasuryPubkey,
                            factory: factoryPDA,
                            pool: poolPDA,
                            userDeposit: userDepositPDA,
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
                    // ── claim_reward_spl ────────────────────────────────────
                    const rewardMint = new PublicKey(poolDetail.pool.rewardToken);
                    const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);

                    const rewardAssetType = await detectAssetType(
                        connection,
                        rewardMint,
                    );
                    const rewardTokenProgram =
                        rewardAssetType === AssetTypeEnum.SPL2022
                            ? TOKEN_2022_PROGRAM_ID
                            : TOKEN_PROGRAM_ID;

                    // User reward ATA
                    const userRewardAta = await getAssociatedTokenAddress(
                        rewardMint,
                        walletPublicKey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    // Treasury reward ATA
                    const treasuryAta = await getAssociatedTokenAddress(
                        rewardMint,
                        treasuryPubkey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    const tx = await program.methods
                        .claimRewardSpl(proofBuffer, indexBN)
                        .accounts({
                            user: walletPublicKey,
                            treasury: treasuryPubkey,
                            factory: factoryPDA,
                            pool: poolPDA,
                            rewardVault: rewardVaultPDA,
                            rewardMint: rewardMint,
                            userRewardAta: userRewardAta,
                            treasuryAta: treasuryAta,
                            userDeposit: userDepositPDA,
                            rewardTokenProgram: rewardTokenProgram,
                        })
                        .transaction();

                    // Prepend user reward ATA creation if needed
                    const ataInfo = await connection.getAccountInfo(userRewardAta);
                    if (!ataInfo) {
                        tx.instructions.unshift(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                userRewardAta,
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

                toast.success("Reward claimed successfully!", {
                    description: `Tx: ${signature}`,
                });

                return signature;
            } catch (error: any) {
                toast.error("Failed to claim reward", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { claimBurnSol };
};
