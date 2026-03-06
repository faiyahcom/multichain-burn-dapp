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
} from "@solana/spl-token";
import {
  getMultichainBurnProgram,
  type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgramSol";
import {
  getRewardVaultPDA,
  getDepositVaultPDA,
  getFactoryPDA,
} from "@/web3/helpers";
import type { PoolDetailResponse } from "@/types/pool";

export type CancelPoolParams = {
  poolAddress: string;
  poolDetail: PoolDetailResponse;
};

export const useCancelPoolSolanaFn = () => {
  const { isConnected, address } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

  const cancelPool = useCallback(
    async (params: CancelPoolParams) => {
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
        // 1️⃣ Resolve mints from poolDetail
        // =============================
        const rewardMint = new PublicKey(params.poolDetail.pool.rewardToken);
        const depositMint = new PublicKey(params.poolDetail.pool.tokenIn);

        // =============================
        // 2️⃣ Derive ATA for owner reward
        // =============================
        const ownerRewardAta = await getAssociatedTokenAddress(
          rewardMint,
          walletPublicKey,
        );

        const ataInfo = await connection.getAccountInfo(ownerRewardAta);

        // =============================
        // 3️⃣ Derive PDAs
        // =============================
        const factoryPDA = getFactoryPDA(program.programId);
        // @ts-ignore
        const factory = await program.account.factoryAccount.fetch(factoryPDA);
        const treasuryPubkey = factory.treasury;
        const poolPDA = new PublicKey(params.poolAddress);
        const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);
        const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

        // =============================
        // 4️⃣ Build cancelPool TX (Anchor)
        // =============================
        const tx = await program.methods
          .canclePool()
          .accounts({
            admin: walletPublicKey,
            factory: factoryPDA,
            pool: poolPDA,
            projectOwner: walletPublicKey,
            treasury: treasuryPubkey,
            rewardMint: rewardMint,
            depositMint: depositMint,
            rewardVault: rewardVaultPDA,
            depositVault: depositVaultPDA,
            ownerRewardAta: ownerRewardAta,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .transaction();

        // =============================
        // 5️⃣ If ATA doesn't exist → prepend instruction
        // =============================
        if (!ataInfo) {
          tx.instructions.unshift(
            createAssociatedTokenAccountInstruction(
              walletPublicKey,
              ownerRewardAta,
              walletPublicKey,
              rewardMint,
            ),
          );
        }

        // =============================
        // 6️⃣ Finalize transaction
        // =============================
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

        toast.success("Pool cancelled successfully!", {
          description: `Tx: ${signature}`,
        });

        return poolPDA.toBase58();
      } catch (error: any) {
        toast.error("Failed to cancel pool", {
          description: error?.message || String(error),
        });
        throw error;
      }
    },
    [isConnected, address, connection, provider],
  );

  return { cancelPool };
};
