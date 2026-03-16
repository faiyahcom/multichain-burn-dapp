import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useAppKitConnection, type Provider } from "@reown/appkit-adapter-solana/react";
import { getMultichainBurnProgram, type BrowserWallet } from "@/web3/contracts/multichainBurnProgramSol";
import type { PoolDetailResponse } from "@/types/pool";

export interface EditPoolSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
    startTime: number;
    endTime: number;
    name: string;
}

export const useEditPoolSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const editPool = useCallback(
        async ({ poolAddress, poolDetail, startTime, endTime, name }: EditPoolSolParams) => {
            try {
                if (!isConnected || !address) throw new Error("Wallet not connected");
                if (!connection || !provider) throw new Error("Solana connection or provider is not available");

                const walletPublicKey = new PublicKey(address);

                const anchorWallet: BrowserWallet = {
                    publicKey: walletPublicKey,
                    signTransaction: provider.signTransaction.bind(provider),
                    signAllTransactions: provider.signAllTransactions?.bind(provider),
                };

                const program = getMultichainBurnProgram(connection, anchorWallet);
                const poolPDA = new PublicKey(poolAddress);
                const adminPubkey = new PublicKey(address);

                const tx = await program.methods
                    .updatePool({
                        timeStart: new BN(startTime),
                        timeEnd: new BN(endTime),
                        targetAddress: new PublicKey(poolDetail.pool.targetAddress),
                        name: name,
                    })
                    .accounts({
                        pool: poolPDA,
                        admin: adminPubkey,
                    })
                    .transaction();

                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.feePayer = adminPubkey;

                const signedTx = await provider.signTransaction(tx);
                const signature = await connection.sendRawTransaction(signedTx.serialize());
                await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

                toast.success("Pool updated successfully!", { description: `Tx: ${signature}` });
                return signature;
            } catch (error: any) {
                toast.error("Failed to update pool", { description: getErrorMessage({ error }) });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { editPool };
};
