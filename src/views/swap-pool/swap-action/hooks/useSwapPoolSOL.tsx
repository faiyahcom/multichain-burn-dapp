import {
    type BrowserWallet,
    getMultichainBurnProgram,
} from "@/web3/contracts/multichainBurnProgramSol";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import {
    getFactoryPDA,
    getRewardVaultPDA,
    getDepositVaultPDA,
    getUserDepositPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import type { PoolDetailResponse } from "@/types/pool";
import { toBaseUnits } from "@/utils/helpers/numbers";

export type DepositSwapPoolParams = {
    amountIn: string;
    poolDetail: PoolDetailResponse;
};

export const useSwapPoolSOL = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const depositSwapPool = useCallback(
        async ({ amountIn, poolDetail }: DepositSwapPoolParams) => {
            try {
                if (!isConnected || !address)
                    throw new Error("Wallet is not connected");

                if (!connection || !provider)
                    throw new Error("Solana connection not available");

                const walletPublicKey = new PublicKey(address);

                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };

                const program = getMultichainBurnProgram(connection, anchorWallet);

                // ===============================
                // 1️⃣ PDAs
                // ===============================
                const factoryPDA = getFactoryPDA(program.programId);

                // @ts-ignore
                const factory = await program.account.factoryAccount.fetch(factoryPDA);

                const treasuryPubkey = factory.treasury as PublicKey;

                const poolPDA = new PublicKey(poolDetail?.pool?.address);

                const userDepositPDA = getUserDepositPDA(
                    poolPDA,
                    walletPublicKey,
                    program.programId,
                );

                const depositMintPubkey = new PublicKey(poolDetail?.pool?.tokenIn);
                const rewardMintPubkey = new PublicKey(poolDetail?.pool?.rewardToken);

                const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

                const targetAddressPubkey = new PublicKey(
                    poolDetail?.pool?.targetAddress,
                );

                // ===============================
                // 2️⃣ Detect token programs
                // ===============================
                const depositAssetType = await detectAssetType(connection, depositMintPubkey);

                // Use the on-chain asset_reward_type from pool data directly
                // (avoids potential PublicKey comparison issues with detectAssetType)
                const isNativeReward = poolDetail?.pool?.assetTypeReward === AssetTypeEnum.NATIVE;
                console.log('[useSwapPoolSOL] isNativeReward:', isNativeReward, 'assetTypeReward:', poolDetail?.pool?.assetTypeReward);

                const depositTokenProgram = getTokenProgramFromAssetType(depositAssetType)!;

                // ===============================
                // 3️⃣ Derive ATAs with correct programs
                // ===============================
                const userDepositATA = await getAssociatedTokenAddress(
                    depositMintPubkey,
                    walletPublicKey,
                    false,
                    depositTokenProgram,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );

                // Only derive reward ATAs when reward is SPL (not native SOL)
                let userRewardATA: PublicKey | null = null;
                let treasuryRewardATA: PublicKey | null = null;
                let rewardTokenProgram: PublicKey | null = null;
                if (!isNativeReward) {
                    const rewardAssetType = await detectAssetType(connection, rewardMintPubkey);
                    rewardTokenProgram = getTokenProgramFromAssetType(rewardAssetType)!;

                    userRewardATA = await getAssociatedTokenAddress(
                        rewardMintPubkey,
                        walletPublicKey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    treasuryRewardATA = await getAssociatedTokenAddress(
                        rewardMintPubkey,
                        treasuryPubkey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );
                }

                const targetDepositATA = await getAssociatedTokenAddress(
                    depositMintPubkey,
                    targetAddressPubkey,
                    false,
                    depositTokenProgram,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );

                // ===============================
                // 4️⃣ Build transaction
                // ===============================
                const tx = new Transaction();

                // Helper: create ATA only if it doesn't exist yet
                const maybeCreateATA = async (
                    ata: PublicKey,
                    mint: PublicKey,
                    owner: PublicKey,
                    tokenProgram: PublicKey,
                ) => {
                    const accountInfo = await connection.getAccountInfo(ata);
                    if (!accountInfo) {
                        tx.add(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                ata,
                                owner,
                                mint,
                                tokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }
                };

                // Only create SPL ATAs — native deposit handled via depositToPoolNative
                if (depositAssetType !== AssetTypeEnum.NATIVE) {
                    await maybeCreateATA(userDepositATA, depositMintPubkey, walletPublicKey, depositTokenProgram);
                    await maybeCreateATA(targetDepositATA, depositMintPubkey, targetAddressPubkey, depositTokenProgram);
                }
                if (!isNativeReward && userRewardATA && treasuryRewardATA && rewardTokenProgram) {
                    await maybeCreateATA(userRewardATA, rewardMintPubkey, walletPublicKey, rewardTokenProgram);
                    await maybeCreateATA(treasuryRewardATA, rewardMintPubkey, treasuryPubkey, rewardTokenProgram);
                }

                // ===============================
                // 5️⃣ Add deposit instruction
                // ===============================
                const isNativeDeposit = depositAssetType === AssetTypeEnum.NATIVE;

                let depositIx;
                if (isNativeDeposit) {
                    depositIx = await program.methods
                        .depositToPoolNative(
                            toBaseUnits(amountIn, poolDetail?.pool?.tokenInDecimals),
                        )
                        .accounts({
                            user: walletPublicKey,
                            treasury: treasuryPubkey,
                            factory: factoryPDA,
                            pool: poolPDA,
                            userDeposit: userDepositPDA,
                            ownerAccount: targetAddressPubkey,
                            // Optional SPL reward accounts (null when reward is native SOL)
                            rewardVault: isNativeReward ? null : rewardVaultPDA,
                            rewardMint: isNativeReward ? null : rewardMintPubkey,
                            userRewardAta: isNativeReward ? null : userRewardATA,
                            treasuryAta: isNativeReward ? null : treasuryRewardATA,
                            rewardTokenProgram: isNativeReward ? null : rewardTokenProgram,
                        } as any)
                        .instruction();
                } else {
                    const depositAmount = toBaseUnits(amountIn, poolDetail?.pool?.tokenInDecimals);
                    console.log('[useSwapPoolSOL] depositAmount (base units):', depositAmount.toString(), 'decimals:', poolDetail?.pool?.tokenInDecimals);
                    depositIx = await program.methods
                        .depositToPoolSpl(depositAmount)
                        .accounts({
                            user: walletPublicKey,
                            treasury: treasuryPubkey,
                            factory: factoryPDA,
                            pool: poolPDA,
                            // Pass null for reward SPL accounts when reward is native SOL
                            rewardVault: isNativeReward ? null : rewardVaultPDA,
                            depositVault: depositVaultPDA,
                            rewardMint: isNativeReward ? null : rewardMintPubkey,
                            depositMint: depositMintPubkey,
                            userDepositAta: userDepositATA,
                            userRewardAta: isNativeReward ? null : userRewardATA,
                            treasuryAta: isNativeReward ? null : treasuryRewardATA,
                            userDeposit: userDepositPDA,
                            systemProgram: SystemProgram.programId,
                            depositTokenProgram,
                            rewardTokenProgram: isNativeReward ? null : rewardTokenProgram,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            ownerDepositAta: targetDepositATA,
                        } as any)
                        .instruction();
                }

                tx.add(depositIx);

                // ===============================
                // 6️⃣ Sign + Send
                // ===============================
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

                toast.success("Deposit successful", {
                    description: signature,
                });

                return signature;
            } catch (error: any) {
                console.log(error);

                toast.error("Deposit failed", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { depositSwapPool };
};
