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
import { toBaseUnits } from "@/utils/helpers/numbers";
import BN from "bn.js";

export interface StakeSolParams {
    /** Pool PDA address */
    poolAddress: string;
    /** Staking (deposit) token mint address */
    depositMint: string;
    /** Human-readable amount to stake */
    amountStr: string;
    /** Deposit token decimals */
    decimals: number;
}

export const useStakeSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const stakeSol = useCallback(
        async ({
            poolAddress,
            depositMint,
            amountStr,
            decimals,
        }: StakeSolParams): Promise<string | undefined> => {
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
                const assetType = await detectAssetType(connection, depositMintPK);
                const isNative = assetType === AssetTypeEnum.NATIVE;
                const depositTokenProgram = getTokenProgramFromAssetType(assetType)!;

                const factoryPDA = getFactoryPDA(program.programId);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);
                const userStakeTrackerPDA = getUserStakeTrackerPDA(
                    poolPDA,
                    walletPublicKey,
                    program.programId,
                );

                // Fetch current stake_count to derive the next stake_entry PDA.
                // Defaults to 0 if the tracker doesn't exist yet (first stake).
                let stakeCount = 0;
                try {
                    // @ts-ignore
                    const tracker = await program.account.userStakeTracker.fetch(
                        userStakeTrackerPDA,
                    );
                    stakeCount = (tracker.stakeCount as BN).toNumber();
                } catch {
                    /* init-if-needed — first stake for this user/pool pair */
                }
                const stakeEntryPDA = getStakeEntryPDA(
                    poolPDA,
                    walletPublicKey,
                    stakeCount,
                    program.programId,
                );

                const amountBN = toBaseUnits(amountStr, decimals);
                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();

                let signature: string;

                if (isNative) {
                    const tx = await program.methods
                        .stakeNative(amountBN)
                        .accounts({
                            user: walletPublicKey,
                            pool: poolPDA,
                            factory: factoryPDA,
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
                    const userTokenAta = await getAssociatedTokenAddress(
                        depositMintPK,
                        walletPublicKey,
                        false,
                        depositTokenProgram,
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
                                depositMintPK,
                                depositTokenProgram,
                                ASSOCIATED_TOKEN_PROGRAM_ID,
                            ),
                        );
                    }

                    const tx = await program.methods
                        .stake(amountBN)
                        .accounts({
                            user: walletPublicKey,
                            pool: poolPDA,
                            factory: factoryPDA,
                            depositMint: depositMintPK,
                            userTokenAta,
                            rewardVault: rewardVaultPDA,
                            depositVault: depositVaultPDA,
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

                toast.success("Staked successfully!", { description: signature });
                return signature;
            } catch (error: unknown) {
                toast.error("Failed to stake", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { stakeSol };
};
