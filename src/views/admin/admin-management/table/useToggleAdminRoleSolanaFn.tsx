import { toast } from "@/components/common/custom-toast";
import type { AdminManagementRole } from "@/types/admin/admin-management";
import { getErrorMessage } from "@/utils/helpers/error-message";
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

type ToggleAdminRoleParams = {
  walletAddress: string;
  enabled: boolean;
  role: AdminManagementRole;
};

export const useToggleAdminRoleSolanaFn = () => {
  const { isConnected, address } = useAppKitAccount({ namespace: "solana" });
  const { connection } = useAppKitConnection();
  const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

  const toggleAdminRole = useCallback(
    async ({ walletAddress, enabled, role }: ToggleAdminRoleParams) => {
      try {
        if (!isConnected || !address) {
          throw new Error("Wallet is not connected");
        }
        if (!connection || !provider) {
          throw new Error("Solana connection or provider is not available");
        }

        const walletPublicKey = new PublicKey(address);
        const targetPubkey = new PublicKey(walletAddress);

        const anchorWallet: BrowserWallet = {
          publicKey: walletPublicKey,
          signTransaction: provider.signTransaction.bind(provider),
          signAllTransactions: provider.signAllTransactions?.bind(provider),
        };

        const program = getMultichainBurnProgram(connection, anchorWallet);
        const factoryPDA = getFactoryPDA(program.programId);

        const tx = await (role === "super_admin"
          ? program.methods
            .updateAdmin(targetPubkey, enabled)
            .accounts({
              admin: walletPublicKey,
              factory: factoryPDA,
            })
            .transaction()
          : program.methods
            .updateSubadmin(targetPubkey, enabled)
            .accounts({
              admin: walletPublicKey,
              factory: factoryPDA,
            })
            .transaction());

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

        toast.success(
          `${role === "super_admin" ? "Super admin" : "Admin"} ${enabled ? "enabled" : "disabled"} successfully!`,
          {
            description: `Tx: ${signature}`,
          },
        );

        return true;
      } catch (error: unknown) {
        toast.error("Failed to update admin role", {
          description: getErrorMessage({ error }),
        });
        return false;
      }
    },
    [isConnected, address, connection, provider],
  );

  return { toggleAdminRole };
};
