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
    getMultichainBurnProgram,
    type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getRewardVaultPDA,
    getDepositVaultPDA,
    getUserDepositPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import type { PoolDetailResponse } from "@/types/pool";
import { toBaseUnits } from "@/utils/helpers/numbers";

export interface DepositBurnSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    amountStr: string;
}

export const useDepositBurnSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const depositBurnSol = useCallback(
        async ({ poolAddress, poolDetail, amountStr }: DepositBurnSolParams) => {
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
                // @ts-ignore
                const factory = await program.account.factoryAccount.fetch(factoryPDA);
                const treasuryPubkey = factory.treasury;

                const poolPDA = new PublicKey(poolAddress);
                const userDepositPDA = getUserDepositPDA(
                    poolPDA,
                    walletPublicKey,
                    program.programId,
                );

                const { tokenInDecimals, assetTypeIn, tokenIn, rewardToken } =
                    poolDetail.pool;

                const amountBN = new BN(
                    toBaseUnits(amountStr, tokenInDecimals).toString(),
                );

                const isNativeDeposit = assetTypeIn === AssetTypeEnum.NATIVE;

                let signature: string;

                if (isNativeDeposit) {
                    const tx = await program.methods
                        .depositToPoolNative(amountBN)
                        .accounts({
                            user: walletPublicKey,
                            treasury: treasuryPubkey,
                            factory: factoryPDA,
                            pool: poolPDA,
                            userDeposit: userDepositPDA,
                            // Optional accounts — null for burn pools
                            ownerAccount: null,
                            rewardVault: null,
                            rewardMint: null,
                            userRewardAta: null,
                            treasuryAta: null,
                            rewardTokenProgram: null,
                        } as any)
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
                    const depositMint = new PublicKey(tokenIn);
                    const rewardMint = new PublicKey(rewardToken);
                    const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                    const depositVaultPDA = getDepositVaultPDA(
                        poolPDA,
                        program.programId,
                    );

                    // Detect correct token programs for each mint
                    const depositAssetType = await detectAssetType(connection, depositMint);
                    const depositTokenProgram = getTokenProgramFromAssetType(depositAssetType)!;

                    const rewardAssetType = await detectAssetType(connection, rewardMint);
                    const rewardTokenProgram = getTokenProgramFromAssetType(rewardAssetType)!;

                    const isNativeReward = rewardAssetType === AssetTypeEnum.NATIVE;

                    const userDepositAta = await getAssociatedTokenAddress(
                        depositMint,
                        walletPublicKey,
                        false,
                        depositTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    // Only derive reward ATAs when reward is SPL (not native SOL)
                    let userRewardAta: PublicKey | null = null;
                    let treasuryAta: PublicKey | null = null;
                    if (!isNativeReward) {
                        userRewardAta = await getAssociatedTokenAddress(
                            rewardMint,
                            walletPublicKey,
                            false,
                            rewardTokenProgram,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
                        );

                        treasuryAta = await getAssociatedTokenAddress(
                            rewardMint,
                            treasuryPubkey,
                            false,
                            rewardTokenProgram,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
                        );
                    }

                    const tx = await program.methods
                        .depositToPoolSpl(amountBN)
                        .accounts({
                            user: walletPublicKey,
                            treasury: treasuryPubkey,
                            factory: factoryPDA,
                            pool: poolPDA,
                            rewardVault: isNativeReward ? null : rewardVaultPDA,
                            depositVault: depositVaultPDA,
                            rewardMint: isNativeReward ? null : rewardMint,
                            depositMint,
                            userDeposit: userDepositPDA,
                            userDepositAta,
                            userRewardAta: isNativeReward ? null : userRewardAta,
                            treasuryAta: isNativeReward ? null : treasuryAta,
                            rewardTokenProgram: isNativeReward ? null : rewardTokenProgram,
                            depositTokenProgram,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            systemProgram: SystemProgram.programId,
                            // @ts-ignore — optional account, null for burn pools
                            ownerDepositAta: null,
                        } as any)
                        .transaction();

                    // Create missing ATAs before the deposit instruction
                    const prependIxs = [];
                    const depositAtaInfo = await connection.getAccountInfo(userDepositAta);

                    if (!depositAtaInfo) {
                        prependIxs.push(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                userDepositAta,
                                walletPublicKey,
                                depositMint,
                                depositTokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }

                    // Only create reward ATAs when reward is SPL
                    if (!isNativeReward && userRewardAta && treasuryAta) {
                        const [rewardAtaInfo, treasuryAtaInfo] = await Promise.all([
                            connection.getAccountInfo(userRewardAta),
                            connection.getAccountInfo(treasuryAta),
                        ]);

                        if (!rewardAtaInfo) {
                            prependIxs.push(
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
                        if (!treasuryAtaInfo) {
                            prependIxs.push(
                                createAssociatedTokenAccountInstruction(
                                    walletPublicKey,
                                    treasuryAta,
                                    treasuryPubkey,
                                    rewardMint,
                                    rewardTokenProgram,
                                    ASSOCIATED_TOKEN_PROGRAM_ID,
                                ),
                            );
                        }
                    }
                    if (prependIxs.length > 0) {
                        tx.instructions.unshift(...prependIxs);
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

                toast.success("Deposit successful!", {
                    description: `Tx: ${signature}`,
                });

                return signature;
            } catch (error: any) {
                console.log(error);

                toast.error("Failed to deposit", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { depositBurnSol };
};
