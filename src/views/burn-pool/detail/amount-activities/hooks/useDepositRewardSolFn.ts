import { useCallback } from "react";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
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
    detectAssetType,
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

                    const rewardAssetType = await detectAssetType(
                        connection,
                        rewardMint,
                    );
                    const rewardTokenProgram =
                        rewardAssetType === AssetTypeEnum.SPL2022
                            ? TOKEN_2022_PROGRAM_ID
                            : TOKEN_PROGRAM_ID;

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
