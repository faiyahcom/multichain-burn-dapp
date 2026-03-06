import {
  type BrowserWallet,
  getMultichainBurnProgram,
} from "@/web3/contracts/multichainBurnProgramSol";
import {
  getFactoryPDA,
  getRewardVaultPDA,
  getDepositVaultPDA,
  getUserDepositPDA,
} from "@/web3/helpers";
import {
  useAppKitConnection,
  type Provider,
} from "@reown/appkit-adapter-solana/react";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useCallback } from "react";
import { toast } from "sonner";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import type { PoolDetailResponse } from "@/types/pool";
import { toBaseUnits } from "@/utils/helpers/numbers";

export type DepositSwapPoolParams = {
  amountIn: string;
  poolDetail: PoolDetailResponse;
};

export const useSwapPoolSOL = () => {
  const { isConnected, address } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

  const depositSwapPool = useCallback(
    async ({ amountIn, poolDetail }: DepositSwapPoolParams) => {
      try {
        if (!isConnected || !address)
          throw new Error("Wallet is not connected");

        if (!connection || !provider)
          throw new Error("Solana connection not available");

        const walletPublicKey = new PublicKey(address);

        const anchorWallet: BrowserWallet = {
          publicKey: walletPublicKey,
          signTransaction: provider.signTransaction.bind(provider),
          signAllTransactions: provider.signAllTransactions?.bind(provider),
        };

        const program = getMultichainBurnProgram(connection, anchorWallet);

        // ===============================
        // 1️⃣ PDAs
        // ===============================

        const factoryPDA = getFactoryPDA(program.programId);

        // @ts-ignore
        const factory = await program.account.factoryAccount.fetch(factoryPDA);

        const treasuryPubkey = factory.treasury as PublicKey;

        const poolPDA = new PublicKey(poolDetail.pool.address);

        const userDepositPDA = getUserDepositPDA(
          poolPDA,
          walletPublicKey,
          program.programId,
        );

        const depositMintPubkey = new PublicKey(poolDetail.pool.tokenIn);

        const rewardMintPubkey = new PublicKey(poolDetail.pool.rewardToken);

        const rewardVaultPDA = getRewardVaultPDA(poolPDA, program.programId);

        const depositVaultPDA = getDepositVaultPDA(poolPDA, program.programId);

        const targetAddressPubkey = new PublicKey(
          poolDetail.pool.targetAddress,
        );

        // ===============================
        // 2️⃣ Derive ATAs
        // ===============================

        const userDepositATA = await getAssociatedTokenAddress(
          depositMintPubkey,
          walletPublicKey,
        );

        const userRewardATA = await getAssociatedTokenAddress(
          rewardMintPubkey,
          walletPublicKey,
        );

        const treasuryRewardATA = await getAssociatedTokenAddress(
          rewardMintPubkey,
          treasuryPubkey,
        );

        const targetDepositATA = await getAssociatedTokenAddress(
          depositMintPubkey,
          targetAddressPubkey,
        );

        // ===============================
        // 3️⃣ Build transaction
        // ===============================

        const tx = new Transaction();

        // Helper to auto-create ATA if missing
        const maybeCreateATA = async (
          ata: PublicKey,
          mint: PublicKey,
          owner: PublicKey,
        ) => {
          const accountInfo = await connection.getAccountInfo(ata);

          if (!accountInfo) {
            tx.add(
              createAssociatedTokenAccountInstruction(
                walletPublicKey, // payer
                ata,
                owner,
                mint,
              ),
            );
          }
        };

        await maybeCreateATA(
          userDepositATA,
          depositMintPubkey,
          walletPublicKey,
        );

        await maybeCreateATA(userRewardATA, rewardMintPubkey, walletPublicKey);

        await maybeCreateATA(
          treasuryRewardATA,
          rewardMintPubkey,
          treasuryPubkey,
        );

        await maybeCreateATA(
          targetDepositATA,
          depositMintPubkey,
          targetAddressPubkey,
        );

        // ===============================
        // 4️⃣ Add deposit instruction
        // ===============================

        const depositIx = await program.methods
          .depositToPoolSpl(
            toBaseUnits(amountIn, poolDetail.pool.tokenInDecimals),
          )
          .accounts({
            user: walletPublicKey,
            treasury: treasuryPubkey,
            factory: factoryPDA,
            pool: poolPDA,
            rewardVault: rewardVaultPDA,
            depositVault: depositVaultPDA,
            rewardMint: rewardMintPubkey,
            depositMint: depositMintPubkey,
            userDepositAccount: userDepositATA,
            userRewardAccount: userRewardATA,
            treasuryRewardAccount: treasuryRewardATA,
            userDeposit: userDepositPDA,
            targetAccount: targetDepositATA,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            ownerDepositAta: targetDepositATA,
          })
          .instruction();

        tx.add(depositIx);

        // ===============================
        // 5️⃣ Sign + Send
        // ===============================

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

        toast.success("Deposit successful", {
          description: signature,
        });

        return signature;
      } catch (error: any) {
        toast.error("Deposit failed", {
          description: error?.message || String(error),
        });
        throw error;
      }
    },
    [isConnected, address, connection, provider],
  );

  return { depositSwapPool };
};
