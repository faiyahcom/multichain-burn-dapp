import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractLaunchpadFactory } from "@/web3/contracts/multichainBurnContractEVM";

export const useCancelPoolEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const cancelPoolEvm = useCallback(
        async ({ poolAddress }: { poolAddress: string }) => {
            if (!isConnected || !walletProvider) throw new Error("Wallet not connected");

            const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
            const signer = await provider.getSigner();
            const contract = getContractLaunchpadFactory(signer);

            const tx = await contract.cancelPool(poolAddress);
            const receipt = await tx.wait();

            toast.success("Launchpad pool cancelled!", { description: `Tx: ${receipt.hash}` });
            return receipt.hash as string;
        },
        [isConnected, walletProvider],
    );

    return { cancelPoolEvm };
};
