import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    getMint,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import {
    getLaunchpadProgram,
    type BrowserWallet,
} from "@/web3/contracts/launchpadProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getLaunchpadConfigPDA,
    getLaunchpadPoolPDA,
    getLaunchpadRewardVaultPDA,
    getLaunchpadDepositVaultPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
} from "@/web3/helpers";
import { toBaseUnits } from "@/utils/helpers/numbers";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";

/** ratio_denominator base — 4 decimal places of price precision */
const RATIO_DENOMINATOR = 10_000;

export type CreateLaunchpadPoolSolParams = {
    poolName: string;
    /** Mint address of the sale/reward token */
    saleToken: string;
    /** Mint address of the payment/deposit token */
    paymentToken: string;
    startTime: Date;
    endTime: Date;
    /** "fixed" → Fixed pool, "dynamic" → Dynamic pool */
    mode: "fixed" | "dynamic";
    /**
     * Fixed mode only: price as a human-readable decimal
     * (how many payment tokens per 1 sale token).
     * Ignored for dynamic mode.
     */
    price?: string;
    /**
     * Claim policy (only "instant" is valid for Fixed mode).
     * "instant"         → is_instant=true,  is_auto=false
     * "after_end_auto"  → is_instant=false, is_auto=true
     * "after_end_claim" → is_instant=false, is_auto=false
     */
    claimPolicy: "instant" | "after_end_auto" | "after_end_claim";
    /** Human-readable sale token budget to lock at pool creation */
    budget: string;
    /** Whether to show the reward amount publicly */
    rewardVisibility: boolean;
    /** When true, save as draft without submitting on-chain */
    isDraft?: boolean;
};

export const useCreateLaunchpadPoolSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const createPool = useCallback(
        async (params: CreateLaunchpadPoolSolParams): Promise<string | undefined> => {
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

                const program = getLaunchpadProgram(connection, anchorWallet);

                const rewardMint = new PublicKey(params.saleToken);
                const depositMint = new PublicKey(params.paymentToken);

                // 1. Detect asset types
                const assetRewardType = await detectAssetType(connection, rewardMint);
                const assetType = await detectAssetType(connection, depositMint);

                const rewardTokenProgramId = getTokenProgramFromAssetType(assetRewardType);
                const depositTokenProgramId = getTokenProgramFromAssetType(assetType);

                // 2. Fetch sale token decimals for budget conversion
                const rewardMintInfo = await getMint(
                    connection,
                    rewardMint,
                    undefined,
                    rewardTokenProgramId!,
                );
                const rewardDecimals = rewardMintInfo.decimals;

                // 3. Derive admin's reward ATA (to receive leftover sale tokens)
                const adminRewardAta = await getAssociatedTokenAddress(
                    rewardMint,
                    walletPublicKey,
                    false,
                    rewardTokenProgramId!,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );
                const ataInfo = await connection.getAccountInfo(adminRewardAta);

                // 4. Derive PDAs
                const launchpadConfigPDA = getLaunchpadConfigPDA(program.programId);

                // @ts-ignore — fetch launchpad config to get pool_count
                const configState = await program.account.launchpadConfig.fetch(
                    launchpadConfigPDA,
                );
                const poolCount: BN = configState.poolCount;

                const poolPDA = getLaunchpadPoolPDA(poolCount.toNumber(), program.programId);
                const rewardVaultPDA = getLaunchpadRewardVaultPDA(poolPDA, program.programId);
                const depositVaultPDA = getLaunchpadDepositVaultPDA(poolPDA, program.programId);

                // burn_factory is the multichain burn program's factory PDA (cross-program read)
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);

                // treasury comes from the burn factory state
                const burnFactoryProgram = await connection.getAccountInfo(burnFactoryPDA);
                if (!burnFactoryProgram) throw new Error("Burn factory account not found");
                // We only need the treasury pubkey; fetch it from the burn program's factory
                // via a raw account parse (offset 8 discriminator + 32 admin = 40, treasury at 40)
                const treasuryPubkey = new PublicKey(
                    burnFactoryProgram.data.slice(40, 72),
                );

                // 5. Build args
                const timeStart = new BN(Math.floor(params.startTime.getTime() / 1000));
                const timeEnd = new BN(Math.floor(params.endTime.getTime() / 1000));

                const isFixed = params.mode === "fixed";
                const ratioBps = isFixed
                    ? new BN(Math.floor(Number(params.price ?? "0") * RATIO_DENOMINATOR))
                    : new BN(0);
                const ratioDenominator = isFixed ? new BN(RATIO_DENOMINATOR) : new BN(0);

                const isInstant = params.claimPolicy === "instant";
                const isAuto = params.claimPolicy === "after_end_auto";

                const rewardAmount = toBaseUnits(params.budget || "0", rewardDecimals);

                // 6. Create ATA instruction if needed
                const prependIxs = [];
                if (!ataInfo) {
                    prependIxs.push(
                        createAssociatedTokenAccountInstruction(
                            walletPublicKey,
                            adminRewardAta,
                            walletPublicKey,
                            rewardMint,
                            rewardTokenProgramId!,
                            ASSOCIATED_TOKEN_PROGRAM_ID,
                        ),
                    );
                }

                // 7. Build transaction
                const tx = await program.methods
                    .createPool({
                        timeStart,
                        timeEnd,
                        assetRewardType,
                        assetType,
                        rewardAmount,
                        name: params.poolName,
                        ratioBps,
                        ratioDenominator,
                        targetAddress: walletPublicKey,
                        isAuto,
                        isInstant,
                        rewardVisibility: params.rewardVisibility,
                    })
                    .accounts({
                        burnFactory: burnFactoryPDA,
                        launchpadConfig: launchpadConfigPDA,
                        admin: walletPublicKey,
                        pool: poolPDA,
                        treasury: treasuryPubkey,
                        rewardMint,
                        depositMint,
                        rewardVault: rewardVaultPDA,
                        depositVault: depositVaultPDA,
                        adminRewardAta,
                        rewardTokenProgram: rewardTokenProgramId!,
                        depositTokenProgram: depositTokenProgramId!,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                        burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                    })
                    .transaction();

                if (prependIxs.length > 0) {
                    tx.instructions.unshift(...prependIxs);
                }

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

                toast.success(
                    params.isDraft ? "Launchpad pool saved as draft!" : "Launchpad pool created!",
                    { description: signature },
                );

                return poolPDA.toBase58();
            } catch (error: unknown) {
                console.error(error);
                toast.error("Create launchpad pool failed", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { createPool };
};
