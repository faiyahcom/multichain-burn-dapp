import { toast } from "@/components/common/custom-toast";
import type { AdminManagementRole } from "@/types/admin/admin-management";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { getContractSwapFactory } from "@/web3/contracts/multichainBurnContractEVM";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { useCallback } from "react";

type ToggleAdminRoleParams = {
  walletAddress: string;
  enabled: boolean;
  role: AdminManagementRole;
};

export const useToggleAdminRoleEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const toggleAdminRole = useCallback(
    async ({ walletAddress, enabled, role }: ToggleAdminRoleParams) => {
      try {
        if (!isConnected || !walletProvider) {
          throw new Error("Wallet not connected");
        }

        if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
          throw new Error(`"${walletAddress}" is not a valid EVM address`);
        }

        const provider = new ethers.BrowserProvider(
          walletProvider as Eip1193Provider,
        );
        const signer = await provider.getSigner();
        const contract = getContractSwapFactory(signer);

        const tx =
          role === "super_admin"
            ? await contract.setSuperAdmin(walletAddress, enabled)
            : await contract.setAdmin(walletAddress, enabled);
        const receipt = await tx.wait();

        toast.success(
          `${role === "super_admin" ? "Super admin" : "Admin"} ${
            enabled ? "enabled" : "disabled"
          } successfully!`,
          {
            description: `Tx: ${receipt.hash}`,
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
    [isConnected, walletProvider],
  );

  return { toggleAdminRole };
};
