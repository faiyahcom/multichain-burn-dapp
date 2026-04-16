import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
    useAppKitConnection,
    type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
    getAssociatedTokenAddress,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BorshAccountsCoder, type Idl } from "@coral-xyz/anchor";
import stakingIdl from "@/web3/contracts/staking.json";
import {
    getStakingProgram,
    type BrowserWallet,
} from "@/web3/contracts/stakingProgramSol";
import { MULTICHAIN_BURN_PROGRAM_ID } from "@/web3/contracts/multichainBurnProgramSol";
import {
    getFactoryPDA,
    getRewardVaultPDA,
    detectAssetType,
    getTokenProgramFromAssetType,
} from "@/web3/helpers";
import type { PoolDetailResponse } from "@/types/pool";

export interface CancelPoolSolParams {
    poolAddress: string;
    poolDetail: PoolDetailResponse;
}

export const useCancelPoolSolFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { connection } = useAppKitConnection();
    const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

    const cancelPoolSol = useCallback(
        async ({ poolAddress, poolDetail }: CancelPoolSolParams) => {
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
                const stakingFactoryPDA = getFactoryPDA(program.programId);
                const burnFactoryPDA = getFactoryPDA(MULTICHAIN_BURN_PROGRAM_ID);
                const poolPDA = new PublicKey(poolAddress);

                // Fetch factory account to get the treasury address
                const accountsCoder = new BorshAccountsCoder(stakingIdl as Idl);
                const factoryInfo = await connection.getAccountInfo(stakingFactoryPDA);
                if (!factoryInfo?.data) throw new Error("Staking factory account not found");
                const factoryAccount = accountsCoder.decode("FactoryAccount", factoryInfo.data);
                const treasuryPubkey = new PublicKey(factoryAccount.treasury.toString());

                const rewardMint = new PublicKey(poolDetail.pool.rewardToken);
                const rewardAssetType = await detectAssetType(connection, rewardMint);
                const rewardTokenProgram = getTokenProgramFromAssetType(rewardAssetType)!;

                const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);

                // The connected wallet acts as both admin and project_owner.
                // Cancel only works correctly when the connected wallet IS the pool owner.
                const projectOwnerPubkey = walletPublicKey;

                const ownerRewardAta = await getAssociatedTokenAddress(
                    rewardMint,
                    projectOwnerPubkey,
                    false,
                    rewardTokenProgram,
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                );

                const tx = await program.methods
                    .canclePool()
                    .accounts({
                        admin: walletPublicKey,
                        factory: stakingFactoryPDA,
                        pool: poolPDA,
                        projectOwner: projectOwnerPubkey,
                        treasury: treasuryPubkey,
                        rewardMint,
                        rewardVault: rewardVaultPDA,
                        ownerRewardAta,
                        rewardTokenProgram,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                        burnFactory: burnFactoryPDA,
                        burnProgram: MULTICHAIN_BURN_PROGRAM_ID,
                    })
                    .transaction();

                const { blockhash, lastValidBlockHeight } =
                    await connection.getLatestBlockhash();
                tx.recentBlockhash = blockhash;
                tx.feePayer = walletPublicKey;

                const signature = await provider.sendTransaction(tx, connection);
                await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight });

                toast.success("Pool cancelled!", { description: signature });
                return signature;
            } catch (error: unknown) {
                toast.error("Cancel pool failed", { description: getErrorMessage({ error }) });
                throw error;
            }
        },
        [isConnected, address, connection, provider],
    );

    return { cancelPoolSol };
};
