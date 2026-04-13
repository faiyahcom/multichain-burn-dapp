import {
  getMultichainBurnProgram,
  type BrowserWallet,
} from "@/web3/contracts/multichainBurnProgramSol";
import { getStakingProgram } from "@/web3/contracts/stakingProgramSol";
import { getFactoryPDA } from "@/web3/helpers";
import type { PoolType } from "@/types/admin/master-pool-management";

const POOL_TYPE_VARIANTS: Record<PoolType, Record<string, object>> = {
  0: { burn: {} },
  1: { swap: {} },
  2: { staking: {} },
  3: { launchpad: {} },
};
import {
  useAppKitConnection,
  type Provider,
} from "@reown/appkit-adapter-solana/react";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";

export const useDisableWhitelistTokenSolanaFn = () => {
  const { isConnected, address } = useAppKitAccount({ namespace: "solana" });
  const { connection } = useAppKitConnection();
  const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

  const disableWhitelistToken = useCallback(
    async ({ tokenAddress, poolTypes }: { tokenAddress: string; poolTypes: PoolType[] }) => {
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
        const factoryPDA = getFactoryPDA(program.programId);

        const tokenPubkey = new PublicKey(tokenAddress);
        const tx = new Transaction();

        for (const poolType of poolTypes) {
          const poolTypeVariant = POOL_TYPE_VARIANTS[poolType];
          const ix = await program.methods
            .updateWhitelistToken(tokenPubkey, false, poolTypeVariant)
            .accounts({
              admin: walletPublicKey,
              factory: factoryPDA,
            } as any)
            .instruction();
          tx.add(ix);
        }

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

        toast.success("Token whitelist disabled successfully!", {
          description: `Tx: ${signature}`,
        });

        return true;
      } catch (error: any) {
        console.log(error);

        toast.error("Failed to disable whitelist token", {
          description: getErrorMessage({ error }),
        });
        return false;
      }
    },
    [isConnected, address, connection, provider],
  );

  return { disableWhitelistToken };
};
