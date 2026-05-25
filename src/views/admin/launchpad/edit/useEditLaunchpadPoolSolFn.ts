import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { PublicKey } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import { BN } from "@coral-xyz/anchor";
import {
    getLaunchpadProgram,
    type BrowserWallet,
} from "@/web3/contracts/launchpadProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import { getFactoryPDA, getLaunchpadConfigPDA } from "@/web3/helpers";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import { toBaseUnits } from "@/utils/helpers/numbers";

/** ratio_denominator base — must match create_pool */
const RATIO_DENOMINATOR = 1_000_000_000_000;

export interface EditLaunchpadPoolSolParams {
    poolAddress: string;
    name: string;
    startTime: number; // unix seconds
    endTime: number; // unix seconds
    mode: "fixed" | "dynamic";
    price: string; // human-readable price (ignored for dynamic pools)
    claimPolicy: "instant" | "after_end_auto" | "after_end_claim";
    rewardVisibility: boolean;
    budget: string; // human-readable total sale amount
    saleTokenDecimals: number;
    /** Target address for fixed-pool deposits; defaults to admin wallet if omitted */
    targetAddress?: string;
}

export const useEditLaunchpadPoolSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const editPool = useCallback(
        async (params: EditLaunchpadPoolSolParams): Promise<void> => {
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
                const poolPDA = new PublicKey(params.poolAddress);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const launchpadConfigPDA = getLaunchpadConfigPDA(program.programId);

                const isFixed = params.mode === "fixed";
                const ratioBps = isFixed
                    ? new BN(Math.floor(RATIO_DENOMINATOR / Number(params.price ?? "1")))
                    : new BN(0);
                const ratioDenominator = isFixed ? new BN(RATIO_DENOMINATOR) : new BN(0);

                const isInstant = params.claimPolicy === "instant";
                const isAuto = params.claimPolicy === "after_end_auto";

                const rewardCap = toBaseUnits(params.budget || "0", params.saleTokenDecimals);

                const targetAddress = params.targetAddress
                    ? new PublicKey(params.targetAddress)
                    : walletPublicKey;

                const tx = await program.methods
                    .updatePool({
                        timeStart: new BN(params.startTime),
                        timeEnd: new BN(params.endTime),
                        targetAddress,
                        name: params.name,
                        isAuto,
                        isInstant,
                        rewardCap,
                        ratioBps,
                        ratioDenominator,
                        rewardVisibility: params.rewardVisibility,
                    })
                    .accounts({
                        admin: walletPublicKey,
                        burnFactory: burnFactoryPDA,
                        launchpadConfig: launchpadConfigPDA,
                        pool: poolPDA,
                        burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                    })
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

                toast.success("Launchpad pool updated!", { description: signature });
            } catch (error: unknown) {
                console.error(error);
                toast.error("Failed to update launchpad pool", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { editPool };
};
