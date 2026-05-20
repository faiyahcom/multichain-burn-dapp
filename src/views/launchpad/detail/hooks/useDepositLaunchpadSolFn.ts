import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    Transaction,
} from "@solana/web3.js";
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
import { BN } from "@coral-xyz/anchor";
import {
    getLaunchpadProgram,
    type BrowserWallet,
} from "@/web3/contracts/launchpadProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID, getMultichainBurnProgram } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getLaunchpadConfigPDA,
    getLaunchpadRewardVaultPDA,
    getLaunchpadDepositVaultPDA,
    getLaunchpadUserDepositPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import { toBaseUnits } from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";

export interface DepositLaunchpadSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    amountStr: string;
}

export const useDepositLaunchpadSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const depositLaunchpadSol = useCallback(
        async ({ poolAddress, poolDetail, amountStr }: DepositLaunchpadSolParams) => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider)
                    throw new Error("Connection not available");

                const walletPublicKey = new PublicKey(address);
                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions:
                        provider.signAllTransactions?.bind(provider),
                };
                const program = getLaunchpadProgram(connection, anchorWallet);

                // Treasury — fetched via typed Anchor account (admin/subadmin are vecs,
                // so raw byte offset would be wrong)
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const programBurn = getMultichainBurnProgram(connection, anchorWallet as any);
                // @ts-ignore
                const factoryState = await programBurn.account.factoryAccount.fetch(burnFactoryPDA);
                const treasuryPubkey = factoryState.treasury as PublicKey;

                const launchpadConfigPDA = getLaunchpadConfigPDA(
                    program.programId,
                );
                const poolPDA = new PublicKey(poolAddress);
                const userDepositPDA = getLaunchpadUserDepositPDA(
                    poolPDA,
                    walletPublicKey,
                    program.programId,
                );

                const {
                    tokenInDecimals,
                    assetTypeIn,
                    tokenIn,
                    rewardToken,
                    assetTypeReward,
                    rewardNumerator,
                    targetAddress,
                } = poolDetail.pool;

                const amountBN = new BN(
                    toBaseUnits(amountStr, tokenInDecimals).toString(),
                );
                const isNativeDeposit = assetTypeIn === AssetTypeEnum.NATIVE;
                const isNativeReward = assetTypeReward === AssetTypeEnum.NATIVE;
                // Fixed pool: rewardNumerator is set and non-zero
                const isFixed = rewardNumerator != null && Number(rewardNumerator) !== 0;

                let signature: string;

                // ── Helper: create any uninitialized ATAs in a single pre-tx ──
                const ensureAtasExist = async (
                    entries: Array<{
                        ata: PublicKey;
                        owner: PublicKey;
                        mint: PublicKey;
                        tokenProgram: PublicKey;
                    }>,
                ) => {
                    const infos = await connection.getMultipleAccountsInfo(
                        entries.map((e) => e.ata),
                    );
                    const missing = entries.filter((_, i) => !infos[i]);
                    if (missing.length === 0) return;
                    const { blockhash: bh, lastValidBlockHeight: lvh } =
                        await connection.getLatestBlockhash();
                    const preTx = new Transaction({
                        recentBlockhash: bh,
                        feePayer: walletPublicKey,
                    });
                    for (const { ata, owner, mint, tokenProgram } of missing) {
                        preTx.add(
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
                    const signed = await provider.signTransaction(preTx);
                    await sendAndConfirmTransactionSafe(
                        connection,
                        signed.serialize(),
                        { blockhash: bh, lastValidBlockHeight: lvh },
                    );
                };

                // ── Helper: resolve optional SPL reward accounts ──────────────
                const resolveRewardAccounts = async () => {
                    if (isNativeReward || !rewardToken) {
                        return {
                            rewardVault: null,
                            rewardMint: null,
                            userRewardAta: null,
                            treasuryAta: null,
                            rewardTokenProgram: null,
                        };
                    }
                    const rewardMintPK = new PublicKey(rewardToken);
                    const rewardAssetType = await detectAssetType(
                        connection,
                        rewardMintPK,
                    );
                    const rewardTokenProgram =
                        getTokenProgramFromAssetType(rewardAssetType)!;
                    return {
                        rewardVault: getLaunchpadRewardVaultPDA(
                            poolPDA,
                            program.programId,
                        ),
                        rewardMint: rewardMintPK,
                        userRewardAta: await getAssociatedTokenAddress(
                            rewardMintPK,
                            walletPublicKey,
                            false,
                            rewardTokenProgram,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
                        ),
                        treasuryAta: await getAssociatedTokenAddress(
                            rewardMintPK,
                            treasuryPubkey,
                            true, // treasury is a PDA (off-curve)
                            rewardTokenProgram,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
                        ),
                        rewardTokenProgram,
                    };
                };

                console.log("[depositLaunchpadSol] params", {
                    poolAddress,
                    amountStr,
                    amountBN: amountBN.toString(),
                    isNativeDeposit,
                    isNativeReward,
                    isFixed,
                    tokenIn,
                    rewardToken,
                    targetAddress,
                });

                if (isNativeDeposit) {
                    // ── deposit_to_pool_native ──────────────────────────────
                    const rewardAccounts = await resolveRewardAccounts();

                    // Create treasury / user reward ATAs if they don't exist
                    if (rewardAccounts.rewardMint && rewardAccounts.rewardTokenProgram) {
                        const toCheck: Array<{ ata: PublicKey; owner: PublicKey; mint: PublicKey; tokenProgram: PublicKey }> = [];
                        if (rewardAccounts.userRewardAta)
                            toCheck.push({ ata: rewardAccounts.userRewardAta, owner: walletPublicKey, mint: rewardAccounts.rewardMint, tokenProgram: rewardAccounts.rewardTokenProgram });
                        if (rewardAccounts.treasuryAta)
                            toCheck.push({ ata: rewardAccounts.treasuryAta, owner: treasuryPubkey, mint: rewardAccounts.rewardMint, tokenProgram: rewardAccounts.rewardTokenProgram });
                        if (toCheck.length > 0) await ensureAtasExist(toCheck);
                    }

                    console.log("[depositLaunchpadSol] depositToPoolNative accounts", {
                        user: walletPublicKey.toBase58(),
                        treasury: treasuryPubkey.toBase58(),
                        burnFactory: burnFactoryPDA.toBase58(),
                        launchpadConfig: launchpadConfigPDA.toBase58(),
                        pool: poolPDA.toBase58(),
                        userDeposit: userDepositPDA.toBase58(),
                        rewardVault: rewardAccounts.rewardVault?.toBase58() ?? null,
                        rewardMint: rewardAccounts.rewardMint?.toBase58() ?? null,
                        userRewardAta: rewardAccounts.userRewardAta?.toBase58() ?? null,
                        treasuryAta: rewardAccounts.treasuryAta?.toBase58() ?? null,
                        rewardTokenProgram: rewardAccounts.rewardTokenProgram?.toBase58() ?? null,
                    });

                    const tx = await program.methods
                        .depositToPoolNative(amountBN)
                        .accounts({
                            user: walletPublicKey,
                            treasury: treasuryPubkey,
                            burnFactory: burnFactoryPDA,
                            launchpadConfig: launchpadConfigPDA,
                            pool: poolPDA,
                            userDeposit: userDepositPDA,
                            ownerAccount: null,
                            rewardVault: rewardAccounts.rewardVault,
                            rewardMint: rewardAccounts.rewardMint,
                            userRewardAta: rewardAccounts.userRewardAta,
                            treasuryAta: rewardAccounts.treasuryAta,
                            rewardTokenProgram: rewardAccounts.rewardTokenProgram,
                            systemProgram: SystemProgram.programId,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
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
                    // ── deposit_to_pool_spl ─────────────────────────────────
                    const depositMintPK = new PublicKey(tokenIn);
                    const depositAssetType = await detectAssetType(
                        connection,
                        depositMintPK,
                    );
                    const depositTokenProgram =
                        getTokenProgramFromAssetType(depositAssetType)!;
                    const depositVaultPDA = getLaunchpadDepositVaultPDA(
                        poolPDA,
                        program.programId,
                    );

                    const userDepositAta = await getAssociatedTokenAddress(
                        depositMintPK,
                        walletPublicKey,
                        false,
                        depositTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    const rewardAccounts = await resolveRewardAccounts();

                    // Create any uninitialized ATAs in one pre-tx
                    {
                        const toCheck: Array<{ ata: PublicKey; owner: PublicKey; mint: PublicKey; tokenProgram: PublicKey }> = [
                            { ata: userDepositAta, owner: walletPublicKey, mint: depositMintPK, tokenProgram: depositTokenProgram },
                        ];
                        if (rewardAccounts.rewardMint && rewardAccounts.rewardTokenProgram) {
                            if (rewardAccounts.userRewardAta)
                                toCheck.push({ ata: rewardAccounts.userRewardAta, owner: walletPublicKey, mint: rewardAccounts.rewardMint, tokenProgram: rewardAccounts.rewardTokenProgram });
                            if (rewardAccounts.treasuryAta)
                                toCheck.push({ ata: rewardAccounts.treasuryAta, owner: treasuryPubkey, mint: rewardAccounts.rewardMint, tokenProgram: rewardAccounts.rewardTokenProgram });
                        }
                        await ensureAtasExist(toCheck);
                    }

                    // ownerDepositAta — only for fixed pools
                    let ownerDepositAta: PublicKey | null = null;
                    if (isFixed && targetAddress) {
                        const targetPubkey = new PublicKey(targetAddress);
                        ownerDepositAta = await getAssociatedTokenAddress(
                            depositMintPK,
                            targetPubkey,
                            false,
                            depositTokenProgram,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
                        );
                    }

                    console.log("[depositLaunchpadSol] depositToPoolSpl accounts", {
                        user: walletPublicKey.toBase58(),
                        treasury: treasuryPubkey.toBase58(),
                        burnFactory: burnFactoryPDA.toBase58(),
                        launchpadConfig: launchpadConfigPDA.toBase58(),
                        pool: poolPDA.toBase58(),
                        depositVault: depositVaultPDA.toBase58(),
                        depositMint: depositMintPK.toBase58(),
                        userDeposit: userDepositPDA.toBase58(),
                        userDepositAta: userDepositAta.toBase58(),
                        depositTokenProgram: depositTokenProgram.toBase58(),
                        rewardVault: rewardAccounts.rewardVault?.toBase58() ?? null,
                        rewardMint: rewardAccounts.rewardMint?.toBase58() ?? null,
                        userRewardAta: rewardAccounts.userRewardAta?.toBase58() ?? null,
                        treasuryAta: rewardAccounts.treasuryAta?.toBase58() ?? null,
                        rewardTokenProgram: rewardAccounts.rewardTokenProgram?.toBase58() ?? null,
                        ownerDepositAta: ownerDepositAta?.toBase58() ?? null,
                    });

                    const tx = await program.methods
                        .depositToPoolSpl(amountBN)
                        .accounts({
                            user: walletPublicKey,
                            treasury: treasuryPubkey,
                            burnFactory: burnFactoryPDA,
                            launchpadConfig: launchpadConfigPDA,
                            pool: poolPDA,
                            rewardVault: rewardAccounts.rewardVault,
                            depositVault: depositVaultPDA,
                            rewardMint: rewardAccounts.rewardMint,
                            depositMint: depositMintPK,
                            userDeposit: userDepositPDA,
                            userDepositAta,
                            userRewardAta: rewardAccounts.userRewardAta,
                            treasuryAta: rewardAccounts.treasuryAta,
                            rewardTokenProgram: rewardAccounts.rewardTokenProgram,
                            depositTokenProgram,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            systemProgram: SystemProgram.programId,
                            rent: SYSVAR_RENT_PUBKEY,
                            ownerDepositAta,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
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
                }

                toast.success("Deposited successfully!", {
                    description: signature,
                });
                return signature;
            } catch (error: unknown) {
                toast.error("Failed to deposit", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { depositLaunchpadSol };
};
