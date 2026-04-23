import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { confirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import { BorshAccountsCoder, type Idl } from "@coral-xyz/anchor";
import idl from "@/web3/contracts/multichain_burn_sc_sol.json";
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
    /** Called after a successful on-chain transfer with the tx signature. */
    onSuccess?: (signature: string) => void;
}

// ── Helper: precise string → raw BN (avoids float drift) ─────────────────────

function toRawAmount(humanStr: string, decimals: number): InstanceType<typeof BN> {
    const [whole = "0", fraction = ""] = humanStr.split(".");
    // pad / truncate fraction to exactly `decimals` digits
    const frac = fraction.padEnd(decimals, "0").slice(0, decimals);
    const raw = BigInt(whole) * BigInt(10 ** decimals) + BigInt(frac || "0");
    return new BN(raw.toString());
}

// ── Helper: query vault balance (handles native SOL vs SPL token) ─────────────

async function queryVaultBalance(
    connection: import("@solana/web3.js").Connection,
    vaultPDA: PublicKey,
    isNative: boolean,
): Promise<InstanceType<typeof BN>> {
    if (isNative) {
        // For native SOL: query lamport balance on the vault PDA directly
        const lamports = await connection.getBalance(vaultPDA);
        return new BN(lamports.toString());
    }
    // For SPL / Token-2022: use the RPC's token account parser
    try {
        const resp = await connection.getTokenAccountBalance(vaultPDA);
        return new BN(resp.value.amount);
    } catch {
        // Vault does not exist or is not a token account → balance is 0
        return new BN(0);
    }
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
            onSuccess,
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

                const rewardMint = new PublicKey(poolDetail?.pool?.rewardToken);
                const depositMint = new PublicKey(poolDetail?.pool?.tokenIn);

                const rewardAssetType = await detectAssetType(connection, rewardMint);
                const depositAssetType = await detectAssetType(connection, depositMint);

                const isNativeReward = rewardAssetType === AssetTypeEnum.NATIVE;
                const isNativeDeposit = depositAssetType === AssetTypeEnum.NATIVE;

                const rewardTokenProgram =
                    rewardAssetType === AssetTypeEnum.SPL2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
                const depositTokenProgram =
                    depositAssetType === AssetTypeEnum.SPL2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

                // Determine which mint we're withdrawing and its decimals
                const tokenMint = mode === "reward" ? rewardMint : depositMint;
                const isNativeToken = mode === "reward" ? isNativeReward : isNativeDeposit;

                // Native SOL (So111…) uses 9 decimals; SPL/Token-2022 fetch from on-chain mint
                let decimals: number;
                if (isNativeToken) {
                    decimals = 9;
                } else {
                    const tokenMintInfo = await getMint(
                        connection,
                        tokenMint,
                        undefined,
                        mode === "reward" ? rewardTokenProgram : depositTokenProgram,
                    );
                    decimals = tokenMintInfo.decimals;
                }

                // Fetch the pool's tracked balance using BorshAccountsCoder
                // (same approach as useOnChainVaultBalance — avoids Anchor v0.30 fetch issues)
                const accountsCoder = new BorshAccountsCoder(idl as Idl);
                const poolAccountInfo = await connection.getAccountInfo(poolPDA);
                if (!poolAccountInfo?.data) {
                    throw new Error("Pool account not found on-chain");
                }
                const poolAccountData = accountsCoder.decode(
                    "PoolAccount",
                    poolAccountInfo.data,
                );
                const trackedBalance: InstanceType<typeof BN> =
                    mode === "reward"
                        ? new BN(poolAccountData.reward_balance.toString())
                        : new BN(poolAccountData.total_deposited.toString());
                console.log(`[batchTransferSol] Pool tracked ${mode} balance:`,
                    trackedBalance.toString(),
                    `(${(trackedBalance.toNumber() / 10 ** decimals).toFixed(6)})`
                );

                const totalRawRequested = recipients.reduce((sum, r) => {
                    const parsed = parseFloat(r.amountStr);
                    if (!parsed || parsed <= 0) return sum;
                    return sum.add(toRawAmount(r.amountStr, decimals));
                }, new BN(0));

                if (trackedBalance.isZero()) {
                    console.log(`The pool's ${mode} vault is empty ` +
                        `(vault: ${(trackedBalance.toNumber() / 10 ** decimals).toFixed(4)}, ` +
                        `tracked: ${(trackedBalance.toNumber() / 10 ** decimals).toFixed(4)}). ` +
                        `No tokens available to transfer.`)
                    throw new Error(
                        "The pool's deposit vault is empty. No tokens available to transfer."
                    );
                }

                if (totalRawRequested.gt(trackedBalance)) {
                    const availableHuman = (trackedBalance.toNumber() / 10 ** decimals).toFixed(4);
                    console.log(`Total requested exceeds actual ${mode} vault balance ` +
                        `(available: ${availableHuman} tokens). Please reduce the amounts.`)
                    throw new Error(
                        `Total requested exceeds vault balance.`
                    );
                }

                if (totalRawRequested.gt(trackedBalance)) {
                    console.log(`Total requested exceeds the pool's tracked ${mode} balance ` +
                        `(${(trackedBalance.toNumber() / 10 ** decimals).toFixed(4)}). ` +
                        `The on-chain contract will reject this transfer.`
                    );

                    throw new Error(
                        `Total requested exceeds vault balance.`
                    );
                }

                // ── Build batch transaction ─────────────────────────────────────
                const tx = new Transaction();

                for (const recipient of recipients) {
                    const amount = parseFloat(recipient.amountStr);
                    if (!amount || amount <= 0) continue;

                    const rawAmount = toRawAmount(recipient.amountStr, decimals);
                    const receiverPubkey = new PublicKey(recipient.address);

                    if (isNativeToken) {
                        // Native SOL: use retreiveRewardNative — no token accounts needed
                        const ix = await program.methods
                            .retreiveRewardNative(rawAmount)
                            .accounts({
                                admin: adminPubkey,
                                factory: factoryPDA,
                                pool: poolPDA,
                                receiverAddress: receiverPubkey,
                                systemProgram: SystemProgram.programId,
                            } as any)
                            .instruction();

                        tx.add(ix);
                    } else {
                        // SPL / Token-2022: use retreiveReward with full token accounts
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
                await confirmTransactionSafe(connection, { signature, blockhash, lastValidBlockHeight });

                toast.success(
                    `${mode === "reward" ? "Reward" : "Deposit"} tokens sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}!`,
                    { description: `Tx: ${signature}` },
                );

                onSuccess?.(signature);

                return signature;
            } catch (error: any) {
                console.log(error);
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
