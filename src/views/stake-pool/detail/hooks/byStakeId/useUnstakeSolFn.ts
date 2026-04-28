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
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getRewardVaultPDA,
    getDepositVaultPDA,
    getUserStakeTrackerPDA,
    getStakeEntryPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
    AssetTypeEnum,
} from "@/web3/helpers";
import BN from "bn.js";

export interface UnstakeSolParams {
    /** Pool PDA address */
    poolAddress: string;
    /** Stake index / stakeId */
    stakeId: number;
    /** Staking (deposit) token mint address */
    depositMint: string;
    /** Reward token mint address */
    rewardMint: string;
}

export const useUnstakeSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const unstakeSol = useCallback(
        async ({
            poolAddress,
            stakeId,
            depositMint,
            rewardMint,
        }: UnstakeSolParams): Promise<string | undefined> => {
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

                const poolPDA = new PublicKey(poolAddress);
                const depositMintPK = new PublicKey(depositMint);
                const rewardMintPK = new PublicKey(rewardMint);

                const assetType = await detectAssetType(connection, depositMintPK);
                const isNativeDeposit = assetType === AssetTypeEnum.NATIVE;
                const depositTokenProgram = getTokenProgramFromAssetType(assetType)!;
                const rewardAssetType = await detectAssetType(connection, rewardMintPK);
                const rewardTokenProgram = getTokenProgramFromAssetType(rewardAssetType)!;

                const factoryPDA = getFactoryPDA(program.programId);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const userStakeTrackerPDA = getUserStakeTrackerPDA(
                    poolPDA,
                    walletPublicKey,
                    program.programId,
                );
                const stakeEntryPDA = getStakeEntryPDA(
                    poolPDA,
                    walletPublicKey,
                    stakeId,
                    program.programId,
                );

                // Fetch factory to get treasury address
                // @ts-ignore
                const factoryState = await program.account.factoryAccount.fetch(factoryPDA);
                const treasury = factoryState.treasury as PublicKey;

                // Fetch stake entry to get the staked amount (required by the instruction)
                // @ts-ignore
                const stakeEntryState = await program.account.stakeEntry.fetch(stakeEntryPDA);
                const amount = stakeEntryState.amount as BN;

                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();

                let signature: string;

                if (isNativeDeposit) {
                    const tx = await program.methods
                        .unstakeNative(amount)
                        .accounts({
                            user: walletPublicKey,
                            pool: poolPDA,
                            factory: factoryPDA,
                            treasury,
                            userStakeTracker: userStakeTrackerPDA,
                            stakeEntry: stakeEntryPDA,
                            systemProgram: SystemProgram.programId,
                            burnFactory: burnFactoryPDA,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
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
                    const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

                    const userTokenAta = await getAssociatedTokenAddress(
                        depositMintPK,
                        walletPublicKey,
                        false,
                        depositTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );
                    const userRewardAta = await getAssociatedTokenAddress(
                        rewardMintPK,
                        walletPublicKey,
                        false,
                        rewardTokenProgram,
                        ASSOCIATED_TOKEN_PROGRAM_ID,
                    );

                    const prependIxs: TransactionInstruction[] = [];
                    const [depositAtaInfo, rewardAtaInfo] = await Promise.all([
                        connection.getAccountInfo(userTokenAta),
                        connection.getAccountInfo(userRewardAta),
                    ]);
                    if (!depositAtaInfo) {
                        prependIxs.push(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                userTokenAta,
                                walletPublicKey,
                                depositMintPK,
                                depositTokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }
                    if (!rewardAtaInfo) {
                        prependIxs.push(
                            createAssociatedTokenAccountInstruction(
                                walletPublicKey,
                                userRewardAta,
                                walletPublicKey,
                                rewardMintPK,
                                rewardTokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }

                    const tx = await program.methods
                        .unstake(amount)
                        .accounts({
                            user: walletPublicKey,
                            pool: poolPDA,
                            factory: factoryPDA,
                            depositMint: depositMintPK,
                            rewardMint: rewardMintPK,
                            treasury,
                            rewardVault: rewardVaultPDA,
                            depositVault: depositVaultPDA,
                            userTokenAta,
                            userRewardAta,
                            userStakeTracker: userStakeTrackerPDA,
                            stakeEntry: stakeEntryPDA,
                            tokenProgram: depositTokenProgram,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            systemProgram: SystemProgram.programId,
                            burnFactory: burnFactoryPDA,
                            burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
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

                toast.success("Unstaked successfully!", { description: signature });
                return signature;
            } catch (error: unknown) {
                toast.error("Failed to unstake", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { unstakeSol };
};
