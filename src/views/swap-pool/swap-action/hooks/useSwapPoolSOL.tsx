import {
    type BrowserWallet,
    getMultichainBurnProgram,
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

                const poolPDA = new PublicKey(poolDetail.pool.address);

                const userDepositPDA = getUserDepositPDA(
                    poolPDA,
                    walletPublicKey,
                    program.programId,
                );

                const depositMintPubkey = new PublicKey(poolDetail.pool.tokenIn);
                const rewardMintPubkey = new PublicKey(poolDetail.pool.rewardToken);

                const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

                const targetAddressPubkey = new PublicKey(
                    poolDetail.pool.targetAddress,
                );

                // ===============================
                // 2️⃣ Detect token programs
                // ===============================
                const depositAssetType = await detectAssetType(connection, depositMintPubkey);
                const rewardAssetType = await detectAssetType(connection, rewardMintPubkey);

                const depositTokenProgram = getTokenProgramFromAssetType(depositAssetType)!;
                const rewardTokenProgram = getTokenProgramFromAssetType(rewardAssetType)!;

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

                const userRewardATA = await getAssociatedTokenAddress(
                    rewardMintPubkey,
                    walletPublicKey,
                    false,
                    rewardTokenProgram,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );

                const treasuryRewardATA = await getAssociatedTokenAddress(
                    rewardMintPubkey,
                    treasuryPubkey,
                    false,
                    rewardTokenProgram,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );

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
                if (rewardAssetType !== AssetTypeEnum.NATIVE) {
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
                            toBaseUnits(amountIn, poolDetail.pool.tokenInDecimals),
                        )
                        .accounts({
                            user: walletPublicKey,
                            treasury: treasuryPubkey,
                            factory: factoryPDA,
                            pool: poolPDA,
                            userDeposit: userDepositPDA,
                        })
                        .instruction();
                } else {
                    depositIx = await program.methods
                        .depositToPoolSpl(
                            toBaseUnits(amountIn, poolDetail.pool.tokenInDecimals),
                        )
                        .accounts({
                            user: walletPublicKey,
                            treasury: treasuryPubkey,
                            factory: factoryPDA,
                            pool: poolPDA,
                            rewardVault: rewardVaultPDA,
                            depositVault: depositVaultPDA,
                            rewardMint: rewardMintPubkey,
                            depositMint: depositMintPubkey,
                            userDepositAta: userDepositATA,
                            userRewardAta: userRewardATA,
                            treasuryAta: treasuryRewardATA,
                            userDeposit: userDepositPDA,
                            systemProgram: SystemProgram.programId,
                            depositTokenProgram,
                            rewardTokenProgram,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            ownerDepositAta: targetDepositATA,
                        })
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

                const signature = await connection.sendRawTransaction(
                    signedTx.serialize(),
                );

                await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight,
                });

                toast.success("Deposit successful", {
                    description: signature,
                });

                return signature;
            } catch (error: any) {
                toast.error("Deposit failed", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { depositSwapPool };
};
