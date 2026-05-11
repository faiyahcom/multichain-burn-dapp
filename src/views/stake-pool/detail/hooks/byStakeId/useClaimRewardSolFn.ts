import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import {
    PublicKey,
    SystemProgram,
    type TransactionInstruction,
} from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
    getStakingProgram,
    type BrowserWallet,
} from "@/web3/contracts/stakingProgramSol";
import { getMultichainBurnProgram, MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getRewardVaultPDA,
    getStakeEntryPDA,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
    type AssetType,
} from "@/web3/helpers";

const CLAIM_REWARD_ERROR_MESSAGE =
    "Failed to claim your reward. Please try again.";
const INSUFFICIENT_REWARD_BALANCE_MESSAGE = "Insufficient reward balance";

export interface ClaimRewardSolParams {
    /** Pool PDA address */
    poolAddress: string;
    /** Stake index / stakeId */
    stakeId: number;
    /** Deposit (staking) token mint address */
    depositMint: string;
    /** Reward token mint address */
    rewardMint: string;
    /** Asset type of the reward token (from poolDetail.pool.assetTypeReward) */
    assetTypeReward: number;
}

export const useClaimRewardSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const claimRewardSol = useCallback(
        async ({
            poolAddress,
            stakeId,
            depositMint,
            rewardMint,
            assetTypeReward,
        }: ClaimRewardSolParams): Promise<string | undefined> => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider) throw new Error("Connection not available");

                const walletPublicKey = new PublicKey(address);
                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };
                const program = getStakingProgram(connection, anchorWallet);
                const programBurn = getMultichainBurnProgram(connection, anchorWallet);

                const poolPDA = new PublicKey(poolAddress);
                const depositMintPK = new PublicKey(depositMint);
                const rewardMintPK = new PublicKey(rewardMint);
                const isNativeReward = (assetTypeReward as AssetType) === AssetTypeEnum.NATIVE;
                const rewardTokenProgram = getTokenProgramFromAssetType(assetTypeReward as AssetType)!;

                const factoryPDA = getFactoryPDA(program.programId);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const stakeEntryPDA = getStakeEntryPDA(
                    poolPDA,
                    walletPublicKey,
                    stakeId,
                    program.programId,
                );

                // Fetch factory to get treasury address
                // @ts-ignore
                const factoryState = await programBurn.account.factoryAccount.fetch(burnFactoryPDA);
                const treasury = factoryState.treasury as PublicKey;

                console.log("treasury", treasury.toString());

                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();

                let signature: string;

                if (isNativeReward) {
                    const tx = await program.methods
                        .claimRewardNative()
                        .accounts({
                            user: walletPublicKey,
                            burnFactory: burnFactoryPDA,
                            depositMint: depositMintPK,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                            treasury,
                            pool: poolPDA,
                            factory: factoryPDA,
                            stakeEntry: stakeEntryPDA,
                            systemProgram: SystemProgram.programId,
                        })
                        .transaction();

                    tx.recentBlockhash = blockhash;
                    tx.feePayer = walletPublicKey;
                    const signedTx = await provider.signTransaction(tx);
                    signature = await sendAndConfirmTransactionSafe(
                        connection,
                        signedTx.serialize(),
                        { blockhash, lastValidBlockHeight },
                    );
                } else {
                    const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                    const userTokenAta = await getAssociatedTokenAddress(
                        rewardMintPK,
                        walletPublicKey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    const prependIxs: TransactionInstruction[] = [];
                    const ataInfo = await connection.getAccountInfo(userTokenAta);
                    if (!ataInfo) {
                        prependIxs.push(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                userTokenAta,
                                walletPublicKey,
                                rewardMintPK,
                                rewardTokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }

                    const treasuryTokenAta = await getAssociatedTokenAddress(
                        rewardMintPK,
                        treasury,
                        true,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    const tx = await program.methods
                        .claimReward()
                        .accounts({
                            user: walletPublicKey,
                            burnFactory: burnFactoryPDA,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                            treasury,
                            treasuryTokenAta,
                            pool: poolPDA,
                            factory: factoryPDA,
                            rewardMint: rewardMintPK,
                            depositMint: depositMintPK,
                            rewardVault: rewardVaultPDA,
                            userTokenAta,
                            stakeEntry: stakeEntryPDA,
                            tokenProgram: rewardTokenProgram,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            systemProgram: SystemProgram.programId,
                        })
                        .transaction();

                    if (prependIxs.length > 0) tx.instructions.unshift(...prependIxs);

                    tx.recentBlockhash = blockhash;
                    tx.feePayer = walletPublicKey;
                    const signedTx = await provider.signTransaction(tx);
                    signature = await sendAndConfirmTransactionSafe(
                        connection,
                        signedTx.serialize(),
                        { blockhash, lastValidBlockHeight },
                    );
                }

                toast.success("Reward claimed successfully!", { description: signature });
                return signature;
            } catch (error: unknown) {
                const errorMessage = getErrorMessage({ error });

                if (errorMessage === INSUFFICIENT_REWARD_BALANCE_MESSAGE) {
                    toast.error(CLAIM_REWARD_ERROR_MESSAGE);
                } else {
                    toast.error("Failed to claim reward", {
                        description: errorMessage,
                    });
                }

                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { claimRewardSol };
};
