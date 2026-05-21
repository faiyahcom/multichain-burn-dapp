import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import {
    getLaunchpadProgram,
    type BrowserWallet,
} from "@/web3/contracts/launchpadProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getLaunchpadConfigPDA,
    getLaunchpadRewardVaultPDA,
    getLaunchpadDepositVaultPDA,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import type { PoolDetailResponse } from "@/types/pool";

export type WithdrawSolParams = {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    recipientAddress: string;
    amount: bigint;
};

export const useWithdrawSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const buildAnchorWallet = (adminPublicKey: PublicKey): BrowserWallet => ({
        publicKey: adminPublicKey,
        signTransaction: provider.signTransaction.bind(provider),
        signAllTransactions: provider.signAllTransactions?.bind(provider),
    });

    /**
     * Withdraw the raised deposit tokens (payment tokens) from the pool.
     * - Native deposit (SOL): uses retreiveRewardNative
     * - SPL deposit: uses retreiveReward(depositMint, amount)
     */
    const withdrawRaisedSol = useCallback(
        async ({ poolAddress, poolDetail, recipientAddress, amount }: WithdrawSolParams) => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider) throw new Error("Connection not available");

                const walletPublicKey = new PublicKey(address);
                const program = getLaunchpadProgram(connection, buildAnchorWallet(walletPublicKey));
                const poolPDA = new PublicKey(poolAddress);
                const receiverPubkey = new PublicKey(recipientAddress);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const launchpadConfigPDA = getLaunchpadConfigPDA(program.programId);
                const amountBN = new BN(amount.toString());

                const assetTypeIn = poolDetail.pool.assetTypeIn ?? AssetTypeEnum.SPL;
                const isNativeDeposit = assetTypeIn === AssetTypeEnum.NATIVE;

                let tx;

                if (isNativeDeposit) {
                    // Native SOL raised — use retreiveRewardNative
                    tx = await program.methods
                        .retreiveRewardNative(amountBN)
                        .accounts({
                            admin: walletPublicKey,
                            burnFactory: burnFactoryPDA,
                            launchpadConfig: launchpadConfigPDA,
                            pool: poolPDA,
                            receiverAddress: receiverPubkey,
                            systemProgram: SystemProgram.programId,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                        })
                        .transaction();
                } else {
                    // SPL deposit token raised — use retreiveReward(depositMint, amount)
                    const rewardMint = new PublicKey(poolDetail.pool.rewardToken);
                    const depositMint = new PublicKey(poolDetail.pool.tokenIn);
                    const assetRewardType = poolDetail.pool.assetTypeReward ?? AssetTypeEnum.SPL;
                    const rewardTokenProgram = getTokenProgramFromAssetType(assetRewardType)!;
                    const depositTokenProgram = getTokenProgramFromAssetType(assetTypeIn)!;
                    const rewardVaultPDA = getLaunchpadRewardVaultPDA(poolPDA, program.programId);
                    const depositVaultPDA = getLaunchpadDepositVaultPDA(poolPDA, program.programId);

                    const receiverRewardTokenAta = await getAssociatedTokenAddress(
                        rewardMint,
                        receiverPubkey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );
                    const receiverDepositTokenAta = await getAssociatedTokenAddress(
                        depositMint,
                        receiverPubkey,
                        false,
                        depositTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    tx = await program.methods
                        .retreiveReward(depositMint, amountBN)
                        .accounts({
                            admin: walletPublicKey,
                            burnFactory: burnFactoryPDA,
                            launchpadConfig: launchpadConfigPDA,
                            pool: poolPDA,
                            rewardMint,
                            depositMint,
                            rewardVault: rewardVaultPDA,
                            depositVault: depositVaultPDA,
                            receiverAddress: receiverPubkey,
                            receiverRewardTokenAta,
                            receiverDepositTokenAta,
                            rewardTokenProgram,
                            depositTokenProgram,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            systemProgram: SystemProgram.programId,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                        })
                        .transaction();
                }

                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.feePayer = walletPublicKey;

                const signedTx = await provider.signTransaction(tx);
                const signature = await sendAndConfirmTransactionSafe(
                    connection,
                    signedTx.serialize(),
                    { blockhash, lastValidBlockHeight },
                );

                toast.success("Raised funds withdrawn!", { description: signature });
                return signature;
            } catch (error: unknown) {
                console.error(error);
                toast.error("Withdraw raised funds failed", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isConnected, address, connection, provider],
    );

    /**
     * Withdraw remaining sale tokens (reward tokens) from the pool.
     * Uses retreiveReward(rewardMint, amount).
     */
    const withdrawRemainingSaleSol = useCallback(
        async ({ poolAddress, poolDetail, recipientAddress, amount }: WithdrawSolParams) => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider) throw new Error("Connection not available");

                const assetRewardType = poolDetail.pool.assetTypeReward ?? AssetTypeEnum.SPL;
                if (assetRewardType === AssetTypeEnum.NATIVE) {
                    throw new Error("Native sale token withdrawal is not supported");
                }

                const walletPublicKey = new PublicKey(address);
                const program = getLaunchpadProgram(connection, buildAnchorWallet(walletPublicKey));
                const poolPDA = new PublicKey(poolAddress);
                const receiverPubkey = new PublicKey(recipientAddress);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const launchpadConfigPDA = getLaunchpadConfigPDA(program.programId);
                const amountBN = new BN(amount.toString());

                const rewardMint = new PublicKey(poolDetail.pool.rewardToken);
                const depositMint = new PublicKey(poolDetail.pool.tokenIn);
                const assetTypeIn = poolDetail.pool.assetTypeIn ?? AssetTypeEnum.SPL;
                const rewardTokenProgram = getTokenProgramFromAssetType(assetRewardType)!;
                const depositTokenProgram = getTokenProgramFromAssetType(assetTypeIn)!;
                const rewardVaultPDA = getLaunchpadRewardVaultPDA(poolPDA, program.programId);
                const depositVaultPDA = getLaunchpadDepositVaultPDA(poolPDA, program.programId);

                const receiverRewardTokenAta = await getAssociatedTokenAddress(
                    rewardMint,
                    receiverPubkey,
                    false,
                    rewardTokenProgram,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );
                const receiverDepositTokenAta = await getAssociatedTokenAddress(
                    depositMint,
                    receiverPubkey,
                    false,
                    depositTokenProgram,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );

                const tx = await program.methods
                    .retreiveReward(rewardMint, amountBN)
                    .accounts({
                        admin: walletPublicKey,
                        burnFactory: burnFactoryPDA,
                        launchpadConfig: launchpadConfigPDA,
                        pool: poolPDA,
                        rewardMint,
                        depositMint,
                        rewardVault: rewardVaultPDA,
                        depositVault: depositVaultPDA,
                        receiverAddress: receiverPubkey,
                        receiverRewardTokenAta,
                        receiverDepositTokenAta,
                        rewardTokenProgram,
                        depositTokenProgram,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
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
                    { blockhash, lastValidBlockHeight },
                );

                toast.success("Remaining sale tokens withdrawn!", { description: signature });
                return signature;
            } catch (error: unknown) {
                console.error(error);
                toast.error("Withdraw remaining sale tokens failed", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isConnected, address, connection, provider],
    );

    return { withdrawRaisedSol, withdrawRemainingSaleSol };
};
