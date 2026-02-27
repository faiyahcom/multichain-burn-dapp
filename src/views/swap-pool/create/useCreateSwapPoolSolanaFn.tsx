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
    TOKEN_PROGRAM_ID,
    getMint,
} from "@solana/spl-token";
import {
    getMultichainBurnProgram,
    type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgram";
import BN from "bn.js";
import {
    getPoolPDA,
    getRewardVaultPDA,
    getDepositVaultPDA,
    getFactoryPDA,
    detectAssetType,
} from "@/web3/helpers";
import { toBaseUnits } from "@/utils/helpers/numbers";

export type CreatePoolParams = {
    rewardMint: PublicKey;
    depositMint: PublicKey;
    rewardAmount: number;
    name: string;
    ratioNumerator: number;
    ratioDenominator: number;
};

export const useCreateSwapPoolSolanaFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const createPool = useCallback(
        async (params: CreatePoolParams) => {
            try {
                if (!isConnected || !address) {
                    throw new Error("Wallet is not connected");
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

                // =============================
                // 1️⃣ Derive ATA
                // =============================
                const ownerRewardAta = await getAssociatedTokenAddress(
                    params.rewardMint,
                    walletPublicKey,
                );

                const ataInfo = await connection.getAccountInfo(ownerRewardAta);

                // =============================
                // 2️⃣ Derive PDAs
                // =============================
                const factoryPDA = getFactoryPDA(program.programId);
                // @ts-ignore
                const factory = await program.account.factoryAccount.fetch(factoryPDA);
                const treasuryPubkey = factory.treasury;
                const poolPDA = getPoolPDA(factory.poolCount, program.programId);
                const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
                const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

                // =============================
                // 3️⃣ Detect token types
                // =============================
                const rewardAssetType = await detectAssetType(
                    connection,
                    params.rewardMint,
                );

                const depositAssetType = await detectAssetType(
                    connection,
                    params.depositMint,
                );

                const rewardMintInfo = await getMint(connection, params.rewardMint);
                const rewardDecimals = rewardMintInfo.decimals;
                console.log("rewardDecimals", rewardDecimals);

                // =============================
                // 4️⃣ Pool Config
                // =============================
                const ratioDenominator = 10000;
                const ratioBps = Math.floor(
                    (params.ratioNumerator / params.ratioDenominator) * ratioDenominator,
                );

                const timeStart = Math.floor(Date.now() / 1000);
                // This pool start like forever
                const timeEnd = 9999999999; // timestamp max

                // =============================
                // 5️⃣ Build createPool TX (Anchor)
                // =============================
                const rewardAmountInSmallestUnits = toBaseUnits(
                    params.rewardAmount.toString(),
                    rewardDecimals,
                );

                const tx = await program.methods
                    .createPool({
                        projectOwner: walletPublicKey,
                        timeStart: new BN(timeStart),
                        timeEnd: new BN(timeEnd),
                        targetAddress: walletPublicKey,
                        name: params.name,
                        ratioBps: new BN(ratioBps),
                        ratioDenominator: new BN(ratioDenominator),
                        assetType: depositAssetType,
                        assetRewardType: rewardAssetType,
                        rewardAmount: rewardAmountInSmallestUnits,
                    })
                    .accounts({
                        factory: factoryPDA,
                        projectOwner: walletPublicKey,
                        pool: poolPDA,
                        treasury: treasuryPubkey,
                        rewardMint: params.rewardMint,
                        depositMint: params.depositMint,
                        rewardVault: rewardVaultPDA,
                        depositVault: depositVaultPDA,
                        systemProgram: SystemProgram.programId,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        ownerRewardAta,
                    })
                    .transaction();

                // =============================
                // 6️⃣ If ATA doesn't exist → prepend instruction
                // =============================
                if (!ataInfo) {
                    tx.instructions.unshift(
                        createAssociatedTokenAccountInstruction(
                            walletPublicKey,
                            ownerRewardAta,
                            walletPublicKey,
                            params.rewardMint,
                        ),
                    );
                }

                // =============================
                // 7️⃣ Finalize transaction
                // =============================
                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();

                tx.recentBlockhash = blockhash;
                tx.feePayer = walletPublicKey;

                // Sign
                const signedTx = await provider.signTransaction(tx);

                // Send
                const signature = await connection.sendRawTransaction(
                    signedTx.serialize(),
                );

                await connection.confirmTransaction({
                    signature,
                    blockhash,
                    lastValidBlockHeight,
                });

                toast.success("Pool created successfully!", {
                    description: `Tx: ${signature}`,
                });

                return signature;
            } catch (error: any) {
                toast.error("Failed to create pool", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { createPool };
};
