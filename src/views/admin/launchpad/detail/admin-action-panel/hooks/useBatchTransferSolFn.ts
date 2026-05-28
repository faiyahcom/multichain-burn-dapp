import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import { BorshAccountsCoder, type Idl } from "@coral-xyz/anchor";
import launchpadIdl from "@/web3/contracts/launchpad.json";
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
    getLaunchpadProgram,
    LAUNCHPAD_PROGRAM_ID,
    type BrowserWallet,
} from "@/web3/contracts/launchpadProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getLaunchpadConfigPDA,
    getLaunchpadRewardVaultPDA,
    getLaunchpadDepositVaultPDA,
    getFactoryPDA,
    detectAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import type { PoolDetailResponse } from "@/types/pool";
import type {
    BatchRecipient,
    TokenMode,
} from "@/views/admin/burn/detail/amount-activities/hooks/useBatchTransferSolFn";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BatchTransferLaunchpadSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    mode: TokenMode;
    recipients: BatchRecipient[];
    /** Called after a successful on-chain transfer with the tx signature. */
    onSuccess?: (signature: string) => void;
}

// ── Helper: precise string → raw BN (avoids float drift) ─────────────────────

function toRawAmount(humanStr: string, decimals: number): InstanceType<typeof BN> {
    const [whole = "0", fraction = ""] = humanStr.split(".");
    const frac = fraction.padEnd(decimals, "0").slice(0, decimals);
    const raw = BigInt(whole) * BigInt(10 ** decimals) + BigInt(frac || "0");
    return new BN(raw.toString());
}

// ── Launchpad IDL coder (same instance as useOnChainVaultBalance) ─────────────
const launchpadAccountsCoder = new BorshAccountsCoder(launchpadIdl as Idl);

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
            onSuccess,
        }: BatchTransferLaunchpadSolParams) => {
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

                const program = getLaunchpadProgram(connection, anchorWallet);

                // ── PDAs ─────────────────────────────────────────────────────────
                // Launchpad uses its own seed prefixes: "launchpad-config",
                // "lp-reward-vault", "lp-deposit-vault"
                const launchpadConfigPDA = getLaunchpadConfigPDA(LAUNCHPAD_PROGRAM_ID);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const poolPDA = new PublicKey(poolAddress);
                const rewardVaultPDA = getLaunchpadRewardVaultPDA(poolPDA, LAUNCHPAD_PROGRAM_ID);
                const depositVaultPDA = getLaunchpadDepositVaultPDA(poolPDA, LAUNCHPAD_PROGRAM_ID);

                const rewardMint = new PublicKey(poolDetail.pool.rewardToken);
                const depositMint = new PublicKey(poolDetail.pool.tokenIn);

                const rewardAssetType = await detectAssetType(connection, rewardMint);
                const depositAssetType = await detectAssetType(connection, depositMint);

                const isNativeReward = rewardAssetType === AssetTypeEnum.NATIVE;
                const isNativeDeposit = depositAssetType === AssetTypeEnum.NATIVE;

                const rewardTokenProgram =
                    rewardAssetType === AssetTypeEnum.SPL2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
                const depositTokenProgram =
                    depositAssetType === AssetTypeEnum.SPL2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

                const tokenMint = mode === "reward" ? rewardMint : depositMint;
                const isNativeToken = mode === "reward" ? isNativeReward : isNativeDeposit;

                // Native SOL uses 9 decimals; SPL/Token-2022 fetch from on-chain mint
                let decimals: number;
                if (isNativeToken) {
                    decimals = 9;
                } else {
                    const mintInfo = await getMint(
                        connection,
                        tokenMint,
                        undefined,
                        mode === "reward" ? rewardTokenProgram : depositTokenProgram,
                    );
                    decimals = mintInfo.decimals;
                }

                // ── Read pool tracked balance via launchpad IDL coder ─────────────
                // Launchpad PoolAccount fields:
                //   reward_balance → remaining sale tokens
                //   total_deposited → total raised payment tokens
                const poolAccountInfo = await connection.getAccountInfo(poolPDA);
                if (!poolAccountInfo?.data) {
                    throw new Error("Pool account not found on-chain");
                }
                const poolAccountData = launchpadAccountsCoder.decode(
                    "PoolAccount",
                    poolAccountInfo.data,
                );
                const trackedBalance: InstanceType<typeof BN> =
                    mode === "reward"
                        ? new BN(poolAccountData.reward_balance.toString())
                        : new BN(poolAccountData.total_deposited.toString());

                // ── Validate totals ───────────────────────────────────────────────
                const totalRawRequested = recipients.reduce((sum, r) => {
                    const parsed = parseFloat(r.amountStr);
                    if (!parsed || parsed <= 0) return sum;
                    return sum.add(toRawAmount(r.amountStr, decimals));
                }, new BN(0));

                if (trackedBalance.isZero()) {
                    throw new Error(
                        `The pool's ${mode === "reward" ? "sale" : "deposit"} vault is empty. No tokens available to transfer.`,
                    );
                }

                if (totalRawRequested.gt(trackedBalance)) {
                    const availableHuman = (trackedBalance.toNumber() / 10 ** decimals).toFixed(4);
                    throw new Error(
                        `Total requested exceeds vault balance (available: ${availableHuman}).`,
                    );
                }

                // ── Build batch transaction ───────────────────────────────────────
                const tx = new Transaction();

                for (const recipient of recipients) {
                    const amount = parseFloat(recipient.amountStr);
                    if (!amount || amount <= 0) continue;

                    const rawAmount = toRawAmount(recipient.amountStr, decimals);
                    const receiverPubkey = new PublicKey(recipient.address);

                    if (isNativeToken) {
                        // Native SOL: use retreive_reward_native
                        const ix = await program.methods
                            .retreiveRewardNative(rawAmount)
                            .accounts({
                                admin: adminPubkey,
                                burnFactory: burnFactoryPDA,
                                launchpadConfig: launchpadConfigPDA,
                                pool: poolPDA,
                                receiverAddress: receiverPubkey,
                                systemProgram: SystemProgram.programId,
                                burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                            } as any)
                            .instruction();

                        tx.add(ix);
                    } else {
                        // SPL / Token-2022: use retreive_reward with full token accounts
                        const receiverRewardAta = await getAssociatedTokenAddress(
                            rewardMint,
                            receiverPubkey,
                            false,
                            rewardTokenProgram,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
                        );

                        const receiverDepositAta = await getAssociatedTokenAddress(
                            depositMint,
                            receiverPubkey,
                            false,
                            depositTokenProgram,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
                        );

                        // Create reward ATA for receiver if it doesn't exist yet
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

                        // Create deposit ATA for receiver if it doesn't exist yet
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

                        // retreive_reward(token_mint, amount) — transfers sale or deposit token
                        const ix = await program.methods
                            .retreiveReward(tokenMint, rawAmount)
                            .accounts({
                                admin: adminPubkey,
                                burnFactory: burnFactoryPDA,
                                launchpadConfig: launchpadConfigPDA,
                                pool: poolPDA,
                                rewardMint,
                                depositMint,
                                rewardVault: rewardVaultPDA,
                                depositVault: depositVaultPDA,
                                receiverAddress: receiverPubkey,
                                receiverRewardTokenAta: receiverRewardAta,
                                receiverDepositTokenAta: receiverDepositAta,
                                rewardTokenProgram,
                                depositTokenProgram,
                                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                                systemProgram: SystemProgram.programId,
                                burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                            } as any)
                            .instruction();

                        tx.add(ix);
                    }
                }

                if (tx.instructions.length === 0) {
                    throw new Error("No valid transfer instructions. Make sure amounts are greater than 0.");
                }

                // ── Sign & send as one transaction ────────────────────────────────
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.feePayer = adminPubkey;

                const signedTx = await provider.signTransaction(tx);
                const signature = await sendAndConfirmTransactionSafe(
                    connection,
                    signedTx.serialize(),
                    { blockhash, lastValidBlockHeight },
                );

                toast.success(
                    `${mode === "reward" ? "Sale" : "Deposit"} tokens sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}!`,
                    { description: `Tx: ${signature}` },
                );

                onSuccess?.(signature);
                return signature;
            } catch (error: unknown) {
                console.error("[useBatchTransferSolFn] launchpad transfer failed:", error);
                toast.error("Failed to transfer tokens", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { batchTransferSol };
};
