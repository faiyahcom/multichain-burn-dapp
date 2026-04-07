import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    getMultichainBurnProgram,
    type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgramSol";
import { getFactoryPDA } from "@/web3/helpers";
import { DECIMAL_FEE_PERCENT } from "./useFeeSettings";

export type UpdateFeeConfigSolParams = {
    treasury: string;
    /** Human-readable SOL amount, e.g. "0.01" (stored as lamports on-chain) */
    creationFee: string;
    /** Percentage, e.g. "5" for 5% (stored as 500 bps on-chain) */
    settlementFee: string;
};

export const useUpdateFeeConfigSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const updateFeeConfigSol = useCallback(
        async ({ treasury, creationFee, settlementFee }: UpdateFeeConfigSolParams) => {
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
                const factoryPDA = getFactoryPDA(program.programId);

                // creationFee: human SOL → lamports (1 SOL = 1e9 lamports)
                const creationFeeLamports = new BN(
                    Math.round(parseFloat(creationFee) * 1e9),
                );
                // settlementFee: percentage → basis points (e.g. 5% → 500)
                const settlementFeeBps = new BN(
                    Math.round(parseFloat(settlementFee) * DECIMAL_FEE_PERCENT),
                );
                const treasuryPubkey = new PublicKey(treasury);

                // IDL: update_settlement_fee_for_pool(new_settlement_fee, creation_fee, treasury)
                // Anchor camelCases snake_case names automatically.
                const tx = await program.methods
                    .updateSettlementFeeForPool(
                        settlementFeeBps,
                        creationFeeLamports,
                        treasuryPubkey,
                    )
                    .accounts({
                        admin: walletPublicKey,
                        factory: factoryPDA,
                    })
                    .rpc();

                toast.success("Fee config updated successfully!", {
                    description: `Tx: ${tx}`,
                });

                return tx as string;
            } catch (error: any) {
                console.log(error);

                toast.error("Failed to update fee config", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { updateFeeConfigSol };
};
