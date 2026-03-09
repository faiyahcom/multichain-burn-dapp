import { useCallback } from "react";
import { toast } from "sonner";
import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    getMint,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
    getMultichainBurnProgram,
    type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgramSol";
import BN from "bn.js";
import {
    getPoolPDA,
    getRewardVaultPDA,
    getDepositVaultPDA,
    getFactoryPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import { toBaseUnits } from "@/utils/helpers/numbers";

export type CreatePoolParams = {
    rewardMint: PublicKey;
    depositMint: PublicKey;
    rewardAmount: number;
    name: string;
    ratioNumerator: number;
    ratioDenominator: number;
};

export const useCreateSwapPoolSolanaFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const createPool = useCallback(
        async (params: CreatePoolParams) => {
            try {
                if (!isConnected || !address) {
                    throw new Error("Wallet is not connected");
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

                // =============================
                // 1️⃣ Detect token types
                // =============================
                const rewardAssetType = await detectAssetType(
                    connection,
                    params.rewardMint,
                );

                const depositAssetType = await detectAssetType(
                    connection,
                    params.depositMint,
                );

                const rewardTokenProgramId =
                    getTokenProgramFromAssetType(rewardAssetType);

                const depositTokenProgramId =
                    getTokenProgramFromAssetType(depositAssetType);

                const rewardMintInfo = await getMint(
                    connection,
                    params.rewardMint,
                    undefined,
                    rewardTokenProgramId!,
                );
                const rewardDecimals = rewardMintInfo.decimals;
                console.log("rewardDecimals", rewardDecimals);

                // =============================
                // 2️⃣ Derive reward ATA
                // =============================
                const ownerRewardAta = await getAssociatedTokenAddress(
                    params.rewardMint,
                    walletPublicKey,
                    false,
                    rewardTokenProgramId!,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );

                const ataInfo = await connection.getAccountInfo(ownerRewardAta);

                // =============================
                // 3️⃣ Derive PDAs
                // =============================
                const factoryPDA = getFactoryPDA(program.programId);
                // @ts-ignore
                const factory = await program.account.factoryAccount.fetch(factoryPDA);
                const treasuryPubkey = factory.treasury;
                const poolPDA = getPoolPDA(factory.poolCount, program.programId);
                const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

                // =============================
                // 4️⃣ Pool Config
                // =============================
                const ratioExtraDecimal = 10000000;
                const ratioBps = params.ratioDenominator * ratioExtraDecimal;
                const ratioDenominator = params.ratioNumerator * ratioExtraDecimal;

                const timeStart = Math.floor(Date.now() / 1000);
                const timeEnd = 9999999999; // max timestamp

                // =============================
                // 4.5 Balance check
                //   → native (SOL): check native SOL balance — contract handles transfer internally
                //   → SPL / SPL-2022: check ATA balance, create ATA if absent
                // =============================
                const rewardAmountInSmallestUnits = toBaseUnits(
                    params.rewardAmount.toString(),
                    rewardDecimals,
                );

                const isRewardNative = rewardAssetType === AssetTypeEnum.NATIVE;

                // Pre-tx instructions (ATA creation for SPL only)
                const prependIxs: TransactionInstruction[] = [];

                if (isRewardNative) {
                    // Contract does system_program::transfer internally for NATIVE.
                    // But it still requires owner_reward_ata to be initialized (AccountNotInitialized).
                    // Create the wSOL ATA if it doesn't exist — but don't fund it.
                    if (!ataInfo) {
                        prependIxs.push(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                ownerRewardAta,
                                walletPublicKey,
                                params.rewardMint,
                                rewardTokenProgramId!,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }

                    // Verify the user has enough native SOL for the reward budget
                    const nativeSolBalance = await connection.getBalance(walletPublicKey);
                    const requiredLamports = rewardAmountInSmallestUnits.toNumber();
                    if (nativeSolBalance < requiredLamports) {
                        throw new Error(
                            `Insufficient SOL balance. Required: ${params.rewardAmount} SOL, ` +
                            `Available: ${(nativeSolBalance / 1e9).toFixed(6)} SOL`,
                        );
                    }
                } else {
                    // SPL / SPL-2022 — check ATA balance, create ATA if absent
                    if (ataInfo) {
                        const tokenBalance = await connection.getTokenAccountBalance(ownerRewardAta);
                        const walletBalanceBN = new BN(tokenBalance.value.amount);
                        if (walletBalanceBN.lt(rewardAmountInSmallestUnits)) {
                            throw new Error(
                                `Insufficient reward token balance. ` +
                                `Required: ${params.rewardAmount}, ` +
                                `Available: ${tokenBalance.value.uiAmountString ?? "0"}`,
                            );
                        }
                    } else {
                        if (params.rewardAmount > 0) {
                            throw new Error(
                                `Insufficient reward token balance. Required: ${params.rewardAmount}, Available: 0`,
                            );
                        }
                        // ATA missing but rewardAmount = 0 — create it
                        prependIxs.push(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                ownerRewardAta,
                                walletPublicKey,
                                params.rewardMint,
                                rewardTokenProgramId!,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }
                }

                // =============================
                // 5️⃣ Build createPool TX (Anchor)
                // =============================
                const tx = await program.methods
                    .createPool({
                        projectOwner: walletPublicKey,
                        timeStart: new BN(timeStart),
                        timeEnd: new BN(timeEnd),
                        targetAddress: walletPublicKey,
                        name: params.name,
                        ratioBps: new BN(ratioBps),
                        ratioDenominator: new BN(ratioDenominator),
                        assetType: depositAssetType,
                        assetRewardType: rewardAssetType,
                        rewardAmount: rewardAmountInSmallestUnits,
                    })
                    .accounts({
                        factory: factoryPDA,
                        projectOwner: walletPublicKey,
                        pool: poolPDA,
                        treasury: treasuryPubkey,
                        rewardMint: params.rewardMint,
                        depositMint: params.depositMint,
                        rewardVault: rewardVaultPDA,
                        depositVault: depositVaultPDA,
                        systemProgram: SystemProgram.programId,
                        rewardTokenProgram: rewardTokenProgramId!,
                        depositTokenProgram: depositTokenProgramId!,
                        ownerRewardAta,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    })
                    .transaction();

                // =============================
                // 6️⃣ Prepend pre-tx instructions (SPL ATA creation only)
                // =============================
                if (prependIxs.length > 0) {
                    tx.instructions.unshift(...prependIxs);
                }

                // =============================
                // 7️⃣ Finalize transaction
                // =============================
                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();

                tx.recentBlockhash = blockhash;
                tx.feePayer = walletPublicKey;

                // Sign
                const signedTx = await provider.signTransaction(tx);

                // Send
                const signature = await connection.sendRawTransaction(
                    signedTx.serialize(),
                );

                await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight,
                });

                toast.success("Pool created successfully!", {
                    description: `Tx: ${signature}`,
                });

                return poolPDA.toBase58();
            } catch (error: any) {
                toast.error("Failed to create pool", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { createPool };
};
