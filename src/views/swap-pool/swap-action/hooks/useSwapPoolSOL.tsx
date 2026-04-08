import { toast } from "@/components/common/custom-toast";
import {
  SOLANA_BACKEND_CHAIN_ID,
  getDecimalsTokenNativeByChainId,
} from "@/config/networks";
import type { PoolDetailResponse } from "@/types/pool";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { toBaseUnits } from "@/utils/helpers/numbers";
import {
  AssetTypeEnum,
  detectAssetType,
  getDepositVaultPDA,
  getFactoryPDA,
  getRewardVaultPDA,
  getTokenProgramFromAssetType,
  getUserDepositPDA,
} from "@/web3/helpers";
import {
  type BrowserWallet,
  getMultichainBurnProgram,
} from "@/web3/contracts/multichainBurnProgramSol";
import {
  useAppKitConnection,
  type Provider,
} from "@reown/appkit-adapter-solana/react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useCallback } from "react";

export type DepositSwapPoolParams = {
  amountIn: string;
  poolDetail: PoolDetailResponse;
};

export type EstimateSwapPoolNetworkFeeResult = {
  ataCreations: number;
  nativeDecimals: number;
  nativeSymbol: string;
  totalGasCost: bigint;
};

type PreparedSwapPoolTransaction = {
  ataCreations: number;
  transaction: Transaction;
  walletPublicKey: PublicKey;
};

const getReadableSolanaNativeContext = () => {
  const nativeCurrency = getDecimalsTokenNativeByChainId(
    SOLANA_BACKEND_CHAIN_ID,
  );

  return {
    nativeDecimals: nativeCurrency?.decimals ?? 9,
    nativeSymbol: nativeCurrency?.symbol ?? "SOL",
  };
};

export const useSwapPoolSOL = () => {
  const { isConnected, address } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

  const buildSwapPoolTransaction = useCallback(
    async ({
      amountIn,
      poolDetail,
    }: DepositSwapPoolParams): Promise<PreparedSwapPoolTransaction> => {
      if (!isConnected || !address) {
        throw new Error("Wallet is not connected");
      }

      if (!connection || !provider) {
        throw new Error("Solana connection not available");
      }

      const walletPublicKey = new PublicKey(address);
      const anchorWallet: BrowserWallet = {
        publicKey: walletPublicKey,
        signTransaction: provider.signTransaction.bind(provider),
        signAllTransactions: provider.signAllTransactions?.bind(provider),
      };

      const program = getMultichainBurnProgram(connection, anchorWallet);
      const factoryPDA = getFactoryPDA(program.programId);

      // @ts-expect-error Anchor account typings are incomplete for this generated IDL.
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
      const targetAddressPubkey = new PublicKey(poolDetail.pool.targetAddress);

      const depositAssetType = await detectAssetType(
        connection,
        depositMintPubkey,
      );
      const depositTokenProgram =
        getTokenProgramFromAssetType(depositAssetType)!;
      const isNativeReward =
        poolDetail.pool.assetTypeReward === AssetTypeEnum.NATIVE;

      const userDepositATA = await getAssociatedTokenAddress(
        depositMintPubkey,
        walletPublicKey,
        false,
        depositTokenProgram,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );

      let userRewardATA: PublicKey | null = null;
      let treasuryRewardATA: PublicKey | null = null;
      let rewardTokenProgram: PublicKey | null = null;

      if (!isNativeReward) {
        const rewardAssetType = await detectAssetType(
          connection,
          rewardMintPubkey,
        );
        rewardTokenProgram = getTokenProgramFromAssetType(rewardAssetType)!;

        userRewardATA = await getAssociatedTokenAddress(
          rewardMintPubkey,
          walletPublicKey,
          false,
          rewardTokenProgram,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        treasuryRewardATA = await getAssociatedTokenAddress(
          rewardMintPubkey,
          treasuryPubkey,
          false,
          rewardTokenProgram,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
      }

      const targetDepositATA = await getAssociatedTokenAddress(
        depositMintPubkey,
        targetAddressPubkey,
        false,
        depositTokenProgram,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );

      const transaction = new Transaction();
      let ataCreations = 0;

      const maybeCreateATA = async (
        ata: PublicKey,
        mint: PublicKey,
        owner: PublicKey,
        tokenProgram: PublicKey,
      ) => {
        const accountInfo = await connection.getAccountInfo(ata);
        if (accountInfo) return;

        ataCreations += 1;
        transaction.add(
          createAssociatedTokenAccountInstruction(
            walletPublicKey,
            ata,
            owner,
            mint,
            tokenProgram,
            ASSOCIATED_TOKEN_PROGRAM_ID,
          ),
        );
      };

      if (depositAssetType !== AssetTypeEnum.NATIVE) {
        await maybeCreateATA(
          userDepositATA,
          depositMintPubkey,
          walletPublicKey,
          depositTokenProgram,
        );
        await maybeCreateATA(
          targetDepositATA,
          depositMintPubkey,
          targetAddressPubkey,
          depositTokenProgram,
        );
      }

      if (
        !isNativeReward &&
        userRewardATA &&
        treasuryRewardATA &&
        rewardTokenProgram
      ) {
        await maybeCreateATA(
          userRewardATA,
          rewardMintPubkey,
          walletPublicKey,
          rewardTokenProgram,
        );
        await maybeCreateATA(
          treasuryRewardATA,
          rewardMintPubkey,
          treasuryPubkey,
          rewardTokenProgram,
        );
      }

      const isNativeDeposit = depositAssetType === AssetTypeEnum.NATIVE;
      const depositAmount = toBaseUnits(
        amountIn,
        poolDetail.pool.tokenInDecimals,
      );

      const depositInstruction = isNativeDeposit
        ? await program.methods
            .depositToPoolNative(depositAmount)
            .accounts({
              user: walletPublicKey,
              treasury: treasuryPubkey,
              factory: factoryPDA,
              pool: poolPDA,
              userDeposit: userDepositPDA,
              ownerAccount: targetAddressPubkey,
              rewardVault: isNativeReward ? null : rewardVaultPDA,
              rewardMint: isNativeReward ? null : rewardMintPubkey,
              userRewardAta: isNativeReward ? null : userRewardATA,
              treasuryAta: isNativeReward ? null : treasuryRewardATA,
              rewardTokenProgram: isNativeReward ? null : rewardTokenProgram,
            } as never)
            .instruction()
        : await program.methods
            .depositToPoolSpl(depositAmount)
            .accounts({
              user: walletPublicKey,
              treasury: treasuryPubkey,
              factory: factoryPDA,
              pool: poolPDA,
              rewardVault: isNativeReward ? null : rewardVaultPDA,
              depositVault: depositVaultPDA,
              rewardMint: isNativeReward ? null : rewardMintPubkey,
              depositMint: depositMintPubkey,
              userDepositAta: userDepositATA,
              userRewardAta: isNativeReward ? null : userRewardATA,
              treasuryAta: isNativeReward ? null : treasuryRewardATA,
              userDeposit: userDepositPDA,
              systemProgram: SystemProgram.programId,
              depositTokenProgram,
              rewardTokenProgram: isNativeReward ? null : rewardTokenProgram,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              ownerDepositAta: targetDepositATA,
            } as never)
            .instruction();

      transaction.add(depositInstruction);

      return {
        ataCreations,
        transaction,
        walletPublicKey,
      };
    },
    [address, connection, isConnected, provider],
  );

  const estimateSwapPoolNetworkFee = useCallback(
    async ({
      amountIn,
      poolDetail,
    }: DepositSwapPoolParams): Promise<EstimateSwapPoolNetworkFeeResult> => {
      if (!connection) {
        throw new Error("Solana connection not available");
      }

      const { ataCreations, transaction, walletPublicKey } =
        await buildSwapPoolTransaction({
          amountIn,
          poolDetail,
        });
      const { blockhash } = await connection.getLatestBlockhash();

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;

      const feeInLamports = await transaction.getEstimatedFee(connection);
      if (feeInLamports == null) {
        throw new Error("Unable to estimate Solana network fee.");
      }

      return {
        ataCreations,
        ...getReadableSolanaNativeContext(),
        totalGasCost: BigInt(feeInLamports),
      };
    },
    [buildSwapPoolTransaction, connection],
  );

  const depositSwapPool = useCallback(
    async ({ amountIn, poolDetail }: DepositSwapPoolParams) => {
      try {
        if (!connection || !provider) {
          throw new Error("Solana connection not available");
        }

        const { transaction, walletPublicKey } = await buildSwapPoolTransaction(
          {
            amountIn,
            poolDetail,
          },
        );
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletPublicKey;

        const signedTx = await provider.signTransaction(transaction);
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
      } catch (error: unknown) {
        toast.error("Deposit failed", {
          description: getErrorMessage({ error }),
        });
        throw error;
      }
    },
    [buildSwapPoolTransaction, connection, provider],
  );

  return { depositSwapPool, estimateSwapPoolNetworkFee };
};
