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
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
    getLaunchpadProgram,
    type BrowserWallet,
} from "@/web3/contracts/launchpadProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID, getMultichainBurnProgram } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getLaunchpadConfigPDA,
    getLaunchpadRewardVaultPDA,
    getLaunchpadUserDepositPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import type { PoolDetailResponse } from "@/types/pool";

export interface ClaimLaunchpadSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
}

export const useClaimLaunchpadSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const claimLaunchpadSol = useCallback(
        async ({ poolAddress, poolDetail }: ClaimLaunchpadSolParams) => {
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

                const { assetTypeReward, assetTypeIn, tokenIn, rewardToken, rewardNumerator } =
                    poolDetail.pool;

                const isNativeReward = assetTypeReward === AssetTypeEnum.NATIVE;
                const isNativeDeposit = assetTypeIn === AssetTypeEnum.NATIVE;
                // depositMint: only required for deferred fixed pools
                const isFixed = rewardNumerator != null && Number(rewardNumerator) !== 0;
                const depositMint =
                    !isNativeDeposit && isFixed && tokenIn
                        ? new PublicKey(tokenIn)
                        : null;

                let signature: string;
                console.log("[claimLaunchpadSol] params", {
                    poolAddress,
                    isNativeReward,
                    isNativeDeposit,
                    isFixed,
                    rewardToken,
                    tokenIn,
                    depositMint: depositMint?.toBase58() ?? null,
                });
                const userDepositPDA = getLaunchpadUserDepositPDA(
                    poolPDA,
                    walletPublicKey,
                    program.programId,
                );

                if (isNativeReward) {
                    // ── claim_native ──────────────────────────────────────
                    // remaining_accounts: [user (W:true), userDeposit (W:true)]
                    const remainingAccounts = [
                        { pubkey: walletPublicKey, isSigner: false, isWritable: true },
                        { pubkey: userDepositPDA,  isSigner: false, isWritable: true },
                    ];

                    console.log("[claimLaunchpadSol] claimNative accounts", {
                        signer: walletPublicKey.toBase58(),
                        treasury: treasuryPubkey.toBase58(),
                        burnFactory: burnFactoryPDA.toBase58(),
                        launchpadConfig: launchpadConfigPDA.toBase58(),
                        pool: poolPDA.toBase58(),
                        depositMint: depositMint?.toBase58() ?? null,
                        userDepositPDA: userDepositPDA.toBase58(),
                    });

                    const tx = await program.methods
                        .claimNative()
                        .accounts({
                            signer: walletPublicKey,
                            treasury: treasuryPubkey,
                            burnFactory: burnFactoryPDA,
                            launchpadConfig: launchpadConfigPDA,
                            pool: poolPDA,
                            depositMint,
                            systemProgram: SystemProgram.programId,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                        } as any)
                        .remainingAccounts(remainingAccounts)
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
                    // ── claim_spl ─────────────────────────────────────────
                    if (!rewardToken) throw new Error("Reward token not set");

                    const rewardMintPK = new PublicKey(rewardToken);
                    const rewardAssetType = await detectAssetType(
                        connection,
                        rewardMintPK,
                    );
                    const rewardTokenProgram =
                        getTokenProgramFromAssetType(rewardAssetType)!;
                    const rewardVaultPDA = getLaunchpadRewardVaultPDA(
                        poolPDA,
                        program.programId,
                    );
                    // treasury_ata = treasury's ATA for the reward token (fee)
                    const treasuryAta = await getAssociatedTokenAddress(
                        rewardMintPK,
                        treasuryPubkey,
                        true, // treasury is a PDA (off-curve)
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    // remaining_accounts: [user (W:false), userDeposit (W:true), userRewardAta (W:true)]
                    const userRewardAta = await getAssociatedTokenAddress(
                        rewardMintPK,
                        walletPublicKey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );
                    const remainingAccounts = [
                        { pubkey: walletPublicKey, isSigner: false, isWritable: false },
                        { pubkey: userDepositPDA,  isSigner: false, isWritable: true },
                        { pubkey: userRewardAta,   isSigner: false, isWritable: true },
                    ];

                    console.log("[claimLaunchpadSol] claimSpl accounts", {
                        signer: walletPublicKey.toBase58(),
                        treasury: treasuryPubkey.toBase58(),
                        treasuryAta: treasuryAta.toBase58(),
                        burnFactory: burnFactoryPDA.toBase58(),
                        launchpadConfig: launchpadConfigPDA.toBase58(),
                        pool: poolPDA.toBase58(),
                        rewardVault: rewardVaultPDA.toBase58(),
                        rewardMint: rewardMintPK.toBase58(),
                        depositMint: depositMint?.toBase58() ?? null,
                        rewardTokenProgram: rewardTokenProgram.toBase58(),
                        userDepositPDA: userDepositPDA.toBase58(),
                        userRewardAta: userRewardAta.toBase58(),
                    });

                    const tx = await program.methods
                        .claimSpl()
                        .accounts({
                            signer: walletPublicKey,
                            treasury: treasuryPubkey,
                            treasuryAta,
                            burnFactory: burnFactoryPDA,
                            launchpadConfig: launchpadConfigPDA,
                            pool: poolPDA,
                            rewardVault: rewardVaultPDA,
                            rewardMint: rewardMintPK,
                            depositMint,
                            rewardTokenProgram,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                        } as any)
                        .remainingAccounts(remainingAccounts)
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

                toast.success("Claimed successfully!", {
                    description: signature,
                });
                return signature;
            } catch (error: unknown) {
                toast.error("Failed to claim", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { claimLaunchpadSol };
};
