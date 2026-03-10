import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    getMint,
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
    getDepositVaultPDA,
    detectAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import type { PoolDetailResponse } from "@/types/pool";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TokenMode = "reward" | "deposit";

export interface BatchRecipient {
    address: string;
    /** Human-readable amount string (e.g. "12.5"). Converted to raw u64 via mint decimals. */
    amountStr: string;
}

export interface BatchTransferSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    mode: TokenMode;
    recipients: BatchRecipient[];
}

// ── Helper: precise string → raw BN (avoids float drift) ─────────────────────

function toRawAmount(humanStr: string, decimals: number): InstanceType<typeof BN> {
    const [whole = "0", fraction = ""] = humanStr.split(".");
    // pad / truncate fraction to exactly `decimals` digits
    const frac = fraction.padEnd(decimals, "0").slice(0, decimals);
    const raw = BigInt(whole) * BigInt(10 ** decimals) + BigInt(frac || "0");
    return new BN(raw.toString());
}


// ── Hook ──────────────────────────────────────────────────────────────────────

export const useBatchTransferSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const batchTransferSol = useCallback(
        async ({
            poolAddress,
            poolDetail,
            mode,
            recipients,
        }: BatchTransferSolParams) => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider) throw new Error("Solana connection or provider unavailable");
                if (recipients.length === 0) throw new Error("No recipients selected");

                const adminPubkey = new PublicKey(address);
                const anchorWallet: BrowserWallet = {
                    publicKey: adminPubkey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };

                const program = getMultichainBurnProgram(connection, anchorWallet);

                // ── PDAs & mints ────────────────────────────────────────────────
                const factoryPDA = getFactoryPDA(program.programId);
                const poolPDA = new PublicKey(poolAddress);
                const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

                const rewardMint = new PublicKey(poolDetail.pool.rewardToken);
                const depositMint = new PublicKey(poolDetail.pool.tokenIn);

                const rewardAssetType = await detectAssetType(connection, rewardMint);
                const depositAssetType = await detectAssetType(connection, depositMint);

                const rewardTokenProgram =
                    rewardAssetType === AssetTypeEnum.SPL2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
                const depositTokenProgram =
                    depositAssetType === AssetTypeEnum.SPL2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

                // Determine which mint we're withdrawing and its decimals
                const tokenMint = mode === "reward" ? rewardMint : depositMint;
                const tokenMintInfo = await getMint(
                    connection,
                    tokenMint,
                    undefined,
                    mode === "reward" ? rewardTokenProgram : depositTokenProgram,
                );
                const decimals = tokenMintInfo.decimals;

                // ── Pre-flight: read ACTUAL vault token balance ──────────────────
                const vaultPDA = mode === "reward" ? rewardVaultPDA : depositVaultPDA;
                const vaultInfo = await connection.getAccountInfo(vaultPDA);
                if (!vaultInfo) {
                    throw new Error(`${mode} vault account not found on-chain.`);
                }

                // Parse SPL / Token-2022 token account to read the amount field
                // Layout: first 64 bytes are mint(32) + owner(32), then u64 amount at offset 64
                const vaultBalance = new BN(vaultInfo.data.subarray(64, 72), "le");

                // Also fetch the pool's tracked balance for comparison
                // @ts-ignore
                const poolAccount = await program.account.poolAccount.fetch(poolPDA);
                const trackedBalance: InstanceType<typeof BN> =
                    mode === "reward" ? poolAccount.rewardBalance : poolAccount.totalDeposited;

                const totalRawRequested = recipients.reduce((sum, r) => {
                    const parsed = parseFloat(r.amountStr);
                    if (!parsed || parsed <= 0) return sum;
                    return sum.add(toRawAmount(r.amountStr, decimals));
                }, new BN(0));

                if (totalRawRequested.gt(vaultBalance)) {
                    const availableHuman = (vaultBalance.toNumber() / 10 ** decimals).toFixed(4);
                    throw new Error(
                        `Total requested exceeds actual ${mode} vault balance ` +
                        `(available: ${availableHuman} tokens). Please reduce the amounts.`
                    );
                }

                if (totalRawRequested.gt(trackedBalance)) {
                    throw new Error(
                        `Total requested (${(totalRawRequested.toNumber() / 10 ** decimals).toFixed(4)}) exceeds ` +
                        `the pool's tracked ${mode} balance (${(trackedBalance.toNumber() / 10 ** decimals).toFixed(4)}). ` +
                        `The on-chain contract will reject this transfer.`
                    );
                }

                // ── Build batch transaction ─────────────────────────────────────
                const tx = new Transaction();

                for (const recipient of recipients) {
                    const amount = parseFloat(recipient.amountStr);
                    if (!amount || amount <= 0) continue;

                    const rawAmount = toRawAmount(recipient.amountStr, decimals);
                    const receiverPubkey = new PublicKey(recipient.address);

                    // Receiver's reward ATA
                    const receiverRewardAta = await getAssociatedTokenAddress(
                        rewardMint,
                        receiverPubkey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    // Receiver's deposit ATA
                    const receiverDepositAta = await getAssociatedTokenAddress(
                        depositMint,
                        receiverPubkey,
                        false,
                        depositTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    // Create reward ATA for receiver if needed
                    const rewardAtaInfo = await connection.getAccountInfo(receiverRewardAta);
                    if (!rewardAtaInfo) {
                        tx.add(
                            createAssociatedTokenAccountInstruction(
                                adminPubkey,
                                receiverRewardAta,
                                receiverPubkey,
                                rewardMint,
                                rewardTokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }

                    // Create deposit ATA for receiver if needed
                    const depositAtaInfo = await connection.getAccountInfo(receiverDepositAta);
                    if (!depositAtaInfo) {
                        tx.add(
                            createAssociatedTokenAccountInstruction(
                                adminPubkey,
                                receiverDepositAta,
                                receiverPubkey,
                                depositMint,
                                depositTokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }

                    // retreiveReward(tokenMint, amount) — works for both reward & deposit tokens
                    const ix = await program.methods
                        .retreiveReward(tokenMint, rawAmount)
                        .accounts({
                            admin: adminPubkey,
                            factory: factoryPDA,
                            pool: poolPDA,
                            rewardMint: rewardMint,
                            depositMint: depositMint,
                            rewardVault: rewardVaultPDA,
                            depositVault: depositVaultPDA,
                            receiverAddress: receiverPubkey,
                            receiverRewardTokenAta: receiverRewardAta,
                            receiverDepositTokenAta: receiverDepositAta,
                            rewardTokenProgram: rewardTokenProgram,
                            depositTokenProgram: depositTokenProgram,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            systemProgram: SystemProgram.programId,
                        } as any)
                        .instruction();

                    tx.add(ix);
                }

                if (tx.instructions.length === 0) {
                    throw new Error("No valid transfer instructions. Make sure amounts are greater than 0.");
                }

                // ── Sign & send as one transaction ─────────────────────────────
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.feePayer = adminPubkey;

                const signedTx = await provider.signTransaction(tx);
                const signature = await connection.sendRawTransaction(signedTx.serialize());
                await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

                toast.success(
                    `${mode === "reward" ? "Reward" : "Deposit"} tokens sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}!`,
                    { description: `Tx: ${signature}` },
                );

                return signature;
            } catch (error: any) {
                toast.error("Failed to transfer tokens", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { batchTransferSol };
};
