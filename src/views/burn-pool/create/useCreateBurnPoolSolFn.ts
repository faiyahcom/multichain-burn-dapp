import { useCallback } from "react";
import { toast } from "sonner";
import { PublicKey, SystemProgram } from "@solana/web3.js";
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
import { BN } from "@coral-xyz/anchor";
import {
    getMultichainBurnProgram,
    type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getPoolPDA,
    getRewardVaultPDA,
    getDepositVaultPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
} from "@/web3/helpers";

export type CreateBurnPoolSolParams = {
    poolName: string;
    tokenBurn: string;
    tokenReward: string;
    startTime: Date;
    endTime: Date;
};

export const useCreateBurnPoolSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const createPool = useCallback(
        async (params: CreateBurnPoolSolParams) => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider)
                    throw new Error("Connection not available");

                const walletPublicKey = new PublicKey(address);

                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };

                const program = getMultichainBurnProgram(connection, anchorWallet);

                const rewardMint = new PublicKey(params.tokenReward);
                const depositMint = new PublicKey(params.tokenBurn);

                // ==============================
                // Detect asset types via helper
                // ==============================
                const assetRewardType = await detectAssetType(connection, rewardMint);

                const assetType = await detectAssetType(connection, depositMint);

                const rewardTokenProgramId =
                    getTokenProgramFromAssetType(assetRewardType);

                const depositTokenProgramId = getTokenProgramFromAssetType(assetType);

                // ==============================
                // ATA for owner reward — always needed (even for native SOL,
                // which uses NATIVE_MINT, a real SPL token under TOKEN_PROGRAM_ID)
                // ==============================
                const ownerRewardAta = await getAssociatedTokenAddress(
                    rewardMint,
                    walletPublicKey,
                    false,
                    rewardTokenProgramId!,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );

                const ataInfo = await connection.getAccountInfo(ownerRewardAta);

                // ==============================
                // Derive PDAs
                // ==============================
                const factoryPDA = getFactoryPDA(program.programId);

                const factoryState =
                    // @ts-ignore
                    await program.account.factoryAccount.fetch(factoryPDA);

                const poolCount: BN = factoryState.poolCount;
                const treasuryPubkey: PublicKey = factoryState.treasury;

                const poolPDA = getPoolPDA(poolCount.toNumber(), program.programId);

                const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);

                const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

                const timeStart = new BN(Math.floor(params.startTime.getTime() / 1000));

                const timeEnd = new BN(Math.floor(params.endTime.getTime() / 1000));

                const tx = await program.methods
                    .createPool({
                        projectOwner: walletPublicKey,
                        timeStart,
                        timeEnd,
                        targetAddress: walletPublicKey,
                        name: params.poolName,
                        ratioBps: new BN(0),
                        ratioDenominator: new BN(10000),
                        assetType,
                        assetRewardType,
                        rewardAmount: new BN(0),
                    })
                    .accounts({
                        factory: factoryPDA,
                        projectOwner: walletPublicKey,
                        pool: poolPDA,
                        treasury: treasuryPubkey,
                        rewardMint,
                        depositMint,
                        rewardVault: rewardVaultPDA,
                        depositVault: depositVaultPDA,
                        systemProgram: SystemProgram.programId,
                        rewardTokenProgram: rewardTokenProgramId!,
                        depositTokenProgram: depositTokenProgramId!,
                        ownerRewardAta,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    })
                    .transaction();

                // Create ATA if it doesn't exist
                if (!ataInfo) {
                    tx.instructions.unshift(
                        createAssociatedTokenAccountInstruction(
                            walletPublicKey,
                            ownerRewardAta,
                            walletPublicKey,
                            rewardMint,
                            rewardTokenProgramId!,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
                        ),
                    );
                }

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

                toast.success("Burn pool created!", {
                    description: signature,
                });

                return poolPDA.toBase58();
            } catch (error: any) {
                toast.error("Create pool failed", {
                    description: error?.message,
                });

                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { createPool };
};
