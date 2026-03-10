import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractBurnFactory } from "@/web3/contracts/multichainBurnContractEVM";
import { getErrorMessage } from "@/utils/helpers/error-message";

export interface EditPoolEvmParams {
    poolAddress: string;
    name?: string;
    startTime: number;
    endTime: number;
}

export const useEditPoolEvmFn = () => {
    const { isConnected, address } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const editPool = useCallback(
        async ({ poolAddress, name, startTime, endTime }: EditPoolEvmParams) => {
            try {
                if (!isConnected || !address || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();
                const contract = getContractBurnFactory(signer);

                // Assume name is bytes32, pad or slice as needed
                const nameBytes32 = name
                    ? ethers.encodeBytes32String(name)
                    : ethers.encodeBytes32String("");

                const tx = await contract.updatePool(
                    poolAddress,
                    nameBytes32,
                    startTime,
                    endTime,
                );
                const receipt = await tx.wait();

                toast.success("Pool updated successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash;
            } catch (error: any) {
                const message = getErrorMessage({ error });
                toast.error("Failed to update pool", { description: message });
                throw error;
            }
        },
        [isConnected, address, walletProvider],
    );

    return { editPool };
};
