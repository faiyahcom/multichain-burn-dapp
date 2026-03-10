import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
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

export interface CancelBurnPoolSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
}

export const useCancelBurnPoolSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const cancelBurnPoolSol = useCallback(
        async ({ poolAddress, poolDetail }: CancelBurnPoolSolParams) => {
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

                // ── 1. Resolve mints ───────────────────────────────────────
                const rewardMint = new PublicKey(poolDetail.pool.rewardToken);
                const depositMint = new PublicKey(poolDetail.pool.tokenIn);

                // ── 2. Detect token programs ───────────────────────────────
                const rewardAssetType = await detectAssetType(connection, rewardMint);
                const rewardTokenProgram =
                    rewardAssetType === AssetTypeEnum.SPL2022
                        ? TOKEN_2022_PROGRAM_ID
                        : TOKEN_PROGRAM_ID;

                const depositAssetType = await detectAssetType(connection, depositMint);
                const depositTokenProgram =
                    depositAssetType === AssetTypeEnum.SPL2022
                        ? TOKEN_2022_PROGRAM_ID
                        : TOKEN_PROGRAM_ID;

                // ── 3. Derive PDAs ─────────────────────────────────────────
                const factoryPDA = getFactoryPDA(program.programId);
                // @ts-ignore
                const factory = await program.account.factoryAccount.fetch(factoryPDA);
                const treasuryPubkey = factory.treasury;

                const poolPDA = new PublicKey(poolAddress);
                const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

                // ── 4. Owner reward ATA ────────────────────────────────────
                const ownerRewardAta = await getAssociatedTokenAddress(
                    rewardMint,
                    walletPublicKey,
                    false,
                    rewardTokenProgram,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );

                const ataInfo = await connection.getAccountInfo(ownerRewardAta);

                // ── 5. Build TX ────────────────────────────────────────────
                const tx = await program.methods
                    .canclePool()
                    .accounts({
                        admin: walletPublicKey,
                        factory: factoryPDA,
                        pool: poolPDA,
                        projectOwner: walletPublicKey,
                        treasury: treasuryPubkey,
                        rewardMint: rewardMint,
                        depositMint: depositMint,
                        rewardVault: rewardVaultPDA,
                        depositVault: depositVaultPDA,
                        ownerRewardAta: ownerRewardAta,
                        rewardTokenProgram: rewardTokenProgram,
                        depositTokenProgram: depositTokenProgram,
                        systemProgram: SystemProgram.programId,
                    })
                    .transaction();

                // ── 6. Prepend ATA creation if needed ─────────────────────
                if (!ataInfo) {
                    tx.instructions.unshift(
                        createAssociatedTokenAccountInstruction(
                            walletPublicKey,
                            ownerRewardAta,
                            walletPublicKey,
                            rewardMint,
                            rewardTokenProgram,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
                        ),
                    );
                }

                // ── 7. Sign & send ─────────────────────────────────────────
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

                toast.success("Pool cancelled successfully!", {
                    description: `Tx: ${signature}`,
                });

                return signature;
            } catch (error: any) {
                toast.error("Failed to cancel pool", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { cancelBurnPoolSol };
};
