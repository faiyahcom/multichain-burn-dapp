import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import { BorshAccountsCoder, type Idl } from "@coral-xyz/anchor";
import stakingIdl from "@/web3/contracts/staking.json";
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
    getStakingProgram,
    type BrowserWallet,
} from "@/web3/contracts/stakingProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
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
    amountStr: string;
}

export interface BatchTransferSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    mode: TokenMode;
    recipients: BatchRecipient[];
    onSuccess?: (signature: string) => void;
}

// ── Helper: string → raw BN ───────────────────────────────────────────────────

function toRawAmount(humanStr: string, decimals: number): InstanceType<typeof BN> {
    const [whole = "0", fraction = ""] = humanStr.split(".");
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

                const program = getStakingProgram(connection, anchorWallet);

                const stakingFactoryPDA = getFactoryPDA(program.programId);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
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

                const tokenMint = mode === "reward" ? rewardMint : depositMint;
                const tokenProgram = mode === "reward" ? rewardTokenProgram : depositTokenProgram;
                const isNativeToken = mode === "reward"
                    ? rewardAssetType === AssetTypeEnum.NATIVE
                    : depositAssetType === AssetTypeEnum.NATIVE;

                let decimals: number;
                if (isNativeToken) {
                    decimals = 9;
                } else {
                    const mintInfo = await getMint(connection, tokenMint, undefined, tokenProgram);
                    decimals = mintInfo.decimals;
                }

                // Fetch pool tracked balances from on-chain account
                const accountsCoder = new BorshAccountsCoder(stakingIdl as Idl);
                const poolAccountInfo = await connection.getAccountInfo(poolPDA);
                if (!poolAccountInfo?.data) throw new Error("Pool account not found on-chain");
                const poolAccountData = accountsCoder.decode("PoolAccount", poolAccountInfo.data);

                // Staking PoolAccount uses `deposit_balance` (not `total_deposited`)
                const trackedBalance: InstanceType<typeof BN> =
                    mode === "reward"
                        ? new BN(poolAccountData.reward_remaining.toString())
                        : new BN(poolAccountData.staking_remaining.toString());

                const totalRawRequested = recipients.reduce((sum, r) => {
                    const parsed = parseFloat(r.amountStr);
                    if (!parsed || parsed <= 0) return sum;
                    return sum.add(toRawAmount(r.amountStr, decimals));
                }, new BN(0));

                if (trackedBalance.isZero()) {
                    throw new Error("The pool's vault is empty. No tokens available to transfer.");
                }

                if (totalRawRequested.gt(trackedBalance)) {
                    throw new Error("Total requested exceeds vault balance.");
                }

                // ── Build batch transaction ─────────────────────────────────────
                const tx = new Transaction();

                for (const recipient of recipients) {
                    const amount = parseFloat(recipient.amountStr);
                    if (!amount || amount <= 0) continue;

                    const rawAmount = toRawAmount(recipient.amountStr, decimals);
                    const receiverPubkey = new PublicKey(recipient.address);

                    // Receiver's ATAs
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

                    // Create ATAs if needed
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

                    // withdraw_tokens(token_mint, amount, is_reward)
                    const isReward = mode === "reward";
                    const ix = await program.methods
                        .withdrawTokens(tokenMint, rawAmount, isReward)
                        .accounts({
                            admin: adminPubkey,
                            burnFactory: burnFactoryPDA,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                            factory: stakingFactoryPDA,
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
                        } as any)
                        .instruction();

                    tx.add(ix);
                }

                if (tx.instructions.length === 0) {
                    throw new Error("No valid transfer instructions. Ensure amounts are greater than 0.");
                }

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
                    `${mode === "reward" ? "Reward" : "Staking"} tokens sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}!`,
                    { description: `Tx: ${signature}` },
                );

                onSuccess?.(signature);
                return signature;
            } catch (error: unknown) {
                console.log(error);
                toast.error("Failed to transfer tokens", { description: getErrorMessage({ error }) });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { batchTransferSol };
};
