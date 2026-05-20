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
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
} from "@solana/spl-token";
import {
    getLaunchpadProgram,
    type BrowserWallet,
} from "@/web3/contracts/launchpadProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getLaunchpadConfigPDA,
    getLaunchpadRewardVaultPDA,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import type { PoolDetailResponse } from "@/types/pool";

export type SubmitPoolSolParams = {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
};

export const useSubmitPoolSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const submitPoolSol = useCallback(
        async ({ poolAddress, poolDetail }: SubmitPoolSolParams) => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider) throw new Error("Connection not available");

                const walletPublicKey = new PublicKey(address);
                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };

                const program = getLaunchpadProgram(connection, anchorWallet);
                const poolPDA = new PublicKey(poolAddress);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const launchpadConfigPDA = getLaunchpadConfigPDA(program.programId);

                const assetRewardType = poolDetail.pool.assetTypeReward ?? AssetTypeEnum.SPL;
                const isNativeReward = assetRewardType === AssetTypeEnum.NATIVE;

                let accounts: Record<string, PublicKey | undefined>;

                if (isNativeReward) {
                    accounts = {
                        admin: walletPublicKey,
                        pool: poolPDA,
                        burnFactory: burnFactoryPDA,
                        launchpadConfig: launchpadConfigPDA,
                        systemProgram: SystemProgram.programId,
                        burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                    };
                } else {
                    const rewardMint = new PublicKey(poolDetail.pool.rewardToken);
                    const rewardTokenProgram = getTokenProgramFromAssetType(assetRewardType)!;
                    const rewardVaultPDA = getLaunchpadRewardVaultPDA(poolPDA, program.programId);
                    const adminRewardAta = await getAssociatedTokenAddress(
                        rewardMint,
                        walletPublicKey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    accounts = {
                        admin: walletPublicKey,
                        pool: poolPDA,
                        burnFactory: burnFactoryPDA,
                        launchpadConfig: launchpadConfigPDA,
                        rewardVault: rewardVaultPDA,
                        rewardMint,
                        adminRewardAta,
                        rewardTokenProgram,
                        systemProgram: SystemProgram.programId,
                        burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                    };
                }

                const tx = await program.methods
                    .submitPool()
                    .accounts(accounts)
                    .transaction();

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

                toast.success("Launchpad pool submitted!", { description: signature });
                return signature;
            } catch (error: unknown) {
                console.error(error);
                toast.error("Submit pool failed", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { submitPoolSol };
};
