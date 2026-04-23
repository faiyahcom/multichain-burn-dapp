import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
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
    getStakingProgram,
    type BrowserWallet,
} from "@/web3/contracts/stakingProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getRewardVaultPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import type { PoolDetailResponse } from "@/types/pool";
import { toBaseUnits } from "@/utils/helpers/numbers";

export interface DepositRewardStakeSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    amountStr: string;
}

export const useDepositRewardSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const depositRewardSol = useCallback(
        async ({ poolAddress, poolDetail, amountStr }: DepositRewardStakeSolParams) => {
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
                const stakingFactoryPDA = getFactoryPDA(program.programId);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const poolPDA = new PublicKey(poolAddress);

                const { rewardTokenDecimals, assetTypeReward, rewardToken } = poolDetail.pool;
                const amountBN = new BN(toBaseUnits(amountStr, rewardTokenDecimals).toString());
                const isNativeReward = assetTypeReward === AssetTypeEnum.NATIVE;

                let signature: string;

                if (isNativeReward) {
                    const tx = await program.methods
                        .depositRewardNative(amountBN)
                        .accounts({
                            projectOwner: walletPublicKey,
                            factory: stakingFactoryPDA,
                            pool: poolPDA,
                            systemProgram: SystemProgram.programId,
                            burnFactory: burnFactoryPDA,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                        })
                        .transaction();

                    const { blockhash, lastValidBlockHeight } =
                        await connection.getLatestBlockhash();
                    tx.recentBlockhash = blockhash;
                    tx.feePayer = walletPublicKey;

                    const signedTx = await provider.signTransaction(tx);
                    signature = await sendAndConfirmTransactionSafe(
                        connection,
                        signedTx.serialize(),
                        { blockhash, lastValidBlockHeight },
                    );
                } else {
                    const rewardMint = new PublicKey(rewardToken);
                    const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);

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
                        .depositReward(amountBN)
                        .accounts({
                            projectOwner: walletPublicKey,
                            factory: stakingFactoryPDA,
                            pool: poolPDA,
                            rewardVault: rewardVaultPDA,
                            rewardMint,
                            ownerRewardAta,
                            rewardTokenProgram,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            systemProgram: SystemProgram.programId,
                            burnFactory: burnFactoryPDA,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                        })
                        .transaction();

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
                    signature = await sendAndConfirmTransactionSafe(
                        connection,
                        signedTx.serialize(),
                        { blockhash, lastValidBlockHeight },
                    );
                }

                toast.success("Reward deposited successfully!", { description: `Tx: ${signature}` });
                return signature;
            } catch (error: unknown) {
                toast.error("Failed to deposit reward", { description: getErrorMessage({ error }) });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { depositRewardSol };
};
