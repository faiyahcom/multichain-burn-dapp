import {
  getMultichainBurnProgram,
  type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgramSol";
import { getFactoryPDA } from "@/web3/helpers";
import {
  useAppKitConnection,
  type Provider,
} from "@reown/appkit-adapter-solana/react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { sendAndConfirmTransactionSafe } from "@/utils/helpers/solana-confirm";
import type { PoolType } from "@/types/admin/master-pool-management";

// Maps numeric pool types to the Anchor enum variant object expected by the IDL.
const POOL_TYPE_VARIANTS: Record<PoolType, Record<string, object>> = {
  0: { burn: {} },
  1: { swap: {} },
  2: { staking: {} },
  3: { launchpad: {} },
};

export const useCreateWhitelistTokenSolanaFn = () => {
  const { isConnected, address } = useAppKitAccount({ namespace: "solana" });
  const { connection } = useAppKitConnection();
  const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

  const createWhitelistToken = useCallback(
    async ({
      tokenAddress,
      poolTypes,
      disablePoolTypes,
      isCreate = true,
    }: {
      tokenAddress: string;
      poolTypes: PoolType[];
      disablePoolTypes?: PoolType[];
      isCreate?: boolean;
    }) => {
      try {
        if (!isConnected || !address) {
          throw new Error("Wallet is not connected");
        }
        if (!connection || !provider) {
          throw new Error("Solana connection or provider is not available");
        }
        if (poolTypes.length === 0 && (!disablePoolTypes || disablePoolTypes.length === 0)) {
          throw new Error("At least one pool type change must be specified");
        }

        const walletPublicKey = new PublicKey(address);

        const anchorWallet: BrowserWallet = {
          publicKey: walletPublicKey,
          signTransaction: provider.signTransaction.bind(provider),
          signAllTransactions: provider.signAllTransactions?.bind(provider),
        };

        const program = getMultichainBurnProgram(connection, anchorWallet);

        const factoryPDA = getFactoryPDA(program.programId);
        const tokenPubkey = new PublicKey(tokenAddress);
        // Build one IX per pool type change
        const tx = new Transaction();

        // Enable IXs
        for (const poolType of poolTypes) {
          const poolTypeVariant = POOL_TYPE_VARIANTS[poolType];

          const ix = await program.methods
            .updateWhitelistToken(tokenPubkey, true, poolTypeVariant, isCreate ? true : null)
            .accounts({
              admin: walletPublicKey,
              factory: factoryPDA,
            } as any)
            .instruction();

          tx.add(ix);
        }

        // Disable IXs
        if (disablePoolTypes) {
          for (const poolType of disablePoolTypes) {
            const poolTypeVariant = POOL_TYPE_VARIANTS[poolType];

            const ix = await program.methods
              .updateWhitelistToken(tokenPubkey, false, poolTypeVariant, null)
              .accounts({
                admin: walletPublicKey,
                factory: factoryPDA,
              } as any)
              .instruction();

            tx.add(ix);
          }
        }

        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash("confirmed");

        tx.recentBlockhash = blockhash;
        tx.feePayer = walletPublicKey;

        // Sign
        const signedTx = await provider.signTransaction(tx);

        // Send – skip preflight to avoid "already processed" errors from
        // the RPC caching the simulated tx hash.
        const signature = await sendAndConfirmTransactionSafe(
          connection,
          signedTx.serialize(),
          { blockhash, lastValidBlockHeight },
          { skipPreflight: true, maxRetries: 3 },
        );

        toast.success("Token whitelisted successfully!", {
          description: `Tx: ${signature}`,
        });

        return true;
      } catch (error: unknown) {
        console.log(error);

        const rawErrorText = JSON.stringify(error) + String((error as Error)?.message ?? "");
        if (
          rawErrorText.includes("TokenAlreadyWhitelisted") ||
          rawErrorText.includes("0x17ad") ||
          rawErrorText.includes("6045")
        ) {
          toast.error("Failed to create whitelist token", {
            description: "Selected pool types are already whitelisted on-chain",
          });
        } else {
          toast.error("Failed to create whitelist token", {
            description: getErrorMessage({ error }),
          });
        }
        return false;
      }
    },
    [isConnected, address, connection, provider],
  );

  return { createWhitelistToken };
};
