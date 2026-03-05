import { getContractSwapFactory } from "@/web3/contracts/multichainBurnContractEVM";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { useCallback } from "react";
import { toast } from "sonner";

export const useDisableWhitelistTokenEvmFn = () => {
  const { isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const disableWhitelistToken = useCallback(
    async ({ tokenAddress }: { tokenAddress: string }) => {
      try {
        if (!isConnected || !walletProvider) {
          throw new Error("Wallet not connected");
        }

        const provider = walletProvider
          ? new ethers.BrowserProvider(walletProvider as Eip1193Provider)
          : null;
        if (!provider) {
          throw new Error("Provider not found");
        }

        const signer = await provider.getSigner();

        const contract = getContractSwapFactory(signer);

        const tx = await contract.removeWhitelistToken(tokenAddress);

        const receipt = await tx.wait();

        toast.success("Token whitelist disabled successfully!", {
          description: `Tx: ${receipt.hash}`,
        });

        return true;
      } catch (error: any) {
        toast.error("Failed to disable whitelist token", {
          description: error?.message || String(error),
        });
        console.log("error", error);
        return false;
      }
    },
    [isConnected, walletProvider],
  );

  return { disableWhitelistToken };
};
