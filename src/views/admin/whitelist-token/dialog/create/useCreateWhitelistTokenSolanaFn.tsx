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
import { PublicKey } from "@solana/web3.js";
import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import type { PoolType } from "@/types/admin/master-pool-management";

type FactoryAccountState = {
  whitelistToken?: PublicKey[];
};

type MultichainBurnProgramWithFactoryAccount = ReturnType<
  typeof getMultichainBurnProgram
> & {
  account: {
    factoryAccount: {
      fetch: (address: PublicKey) => Promise<FactoryAccountState>;
    };
  };
};

/**
 * Maps numeric pool type to the Anchor enum variant object expected by the IDL.
 * IDL PoolType: Swap (0), Burn (1), Staking (2), Launchpad (3)
 */
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
      poolType,
    }: {
      tokenAddress: string;
      poolType: PoolType;
    }) => {
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

        const program = getMultichainBurnProgram(
          connection,
          anchorWallet,
        ) as MultichainBurnProgramWithFactoryAccount;

        const factoryPDA = getFactoryPDA(program.programId);
        const tokenPubkey = new PublicKey(tokenAddress);
        const factory = await program.account.factoryAccount.fetch(factoryPDA);
        const isTokenWhitelisted = (factory.whitelistToken ?? []).some(
          (whitelistedToken) => whitelistedToken.equals(tokenPubkey),
        );

        if (isTokenWhitelisted) {
          throw new Error("Token is already whitelisted on-chain");
        }

        const poolTypeVariant = POOL_TYPE_VARIANTS[poolType];

        const tx = await program.methods
          .updateWhitelistToken(tokenPubkey, true, poolTypeVariant)
          .accounts({
            admin: walletPublicKey,
            factory: factoryPDA,
          } as any)
          .transaction();

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

        toast.success("Token whitelisted successfully!", {
          description: `Tx: ${signature}`,
        });

        return true;
      } catch (error: unknown) {
        console.log(error);

        toast.error("Failed to create whitelist token", {
          description: getErrorMessage({ error }),
        });
        return false;
      }
    },
    [isConnected, address, connection, provider],
  );

  return { createWhitelistToken };
};

