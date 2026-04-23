import { toast } from "@/components/common/custom-toast";
import type { AdminManagementRole } from "@/types/admin/admin-management";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { confirmTransactionSafe } from "@/utils/helpers/solana-confirm";
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

type ToggleAdminRoleParams = {
  walletAddress: string;
  enabled: boolean;
  role: AdminManagementRole;
};

export const useToggleAdminRoleSolanaFn = () => {
  const { isConnected, address } = useAppKitAccount({ namespace: "solana" });
  const { connection } = useAppKitConnection();
  const { walletProvider: provider } = useAppKitProvider<Provider>("solana");

  const getProgramContext = () => {
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

    return {
      connection,
      provider,
      walletPublicKey,
      program,
      factoryPDA,
    };
  };

  const buildToggleInstruction = async (
    programContext: ReturnType<typeof getProgramContext>,
    { walletAddress, enabled, role }: ToggleAdminRoleParams,
  ) => {
    const targetPubkey = new PublicKey(walletAddress);

    return role === "super_admin"
      ? programContext.program.methods
        .updateAdmin(targetPubkey, enabled)
        .accounts({
          admin: programContext.walletPublicKey,
          factory: programContext.factoryPDA,
        })
        .instruction()
      : programContext.program.methods
        .updateSubadmin(targetPubkey, enabled)
        .accounts({
          admin: programContext.walletPublicKey,
          factory: programContext.factoryPDA,
        })
        .instruction();
  };

  const toggleAdminRole = useCallback(
    async ({ walletAddress, enabled, role }: ToggleAdminRoleParams) => {
      try {
        const programContext = getProgramContext();
        const tx = new Transaction().add(
          await buildToggleInstruction(programContext, {
            walletAddress,
            enabled,
            role,
          }),
        );

        const { blockhash, lastValidBlockHeight } =
          await programContext.connection.getLatestBlockhash();

        tx.recentBlockhash = blockhash;
        tx.feePayer = programContext.walletPublicKey;

        const signedTx = await programContext.provider.signTransaction(tx);
        const signature = await programContext.connection.sendRawTransaction(
          signedTx.serialize(),
        );

        await confirmTransactionSafe(programContext.connection, {
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

  const toggleAdminRoles = useCallback(
    async (operations: ToggleAdminRoleParams[]) => {
      try {
        if (!operations.length) {
          return true;
        }

        const programContext = getProgramContext();
        const tx = new Transaction();

        for (const operation of operations) {
          tx.add(await buildToggleInstruction(programContext, operation));
        }

        const { blockhash, lastValidBlockHeight } =
          await programContext.connection.getLatestBlockhash();

        tx.recentBlockhash = blockhash;
        tx.feePayer = programContext.walletPublicKey;

        const signedTx = await programContext.provider.signTransaction(tx);
        const signature = await programContext.connection.sendRawTransaction(
          signedTx.serialize(),
        );

        await confirmTransactionSafe(programContext.connection, {
          signature,
          blockhash,
          lastValidBlockHeight,
        });

        toast.success("Admin role updated successfully!", {
          description: `Tx: ${signature}`,
        });

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

  return { toggleAdminRole, toggleAdminRoles };
};
