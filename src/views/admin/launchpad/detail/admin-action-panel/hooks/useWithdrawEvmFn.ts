import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import { getContractLaunchpadFactory } from "@/web3/contracts/multichainBurnContractEVM";

export const useWithdrawEvmFn = () => {
    const { walletProvider } = useAppKitProvider("eip155");
    const { isConnected: walletConnected } = useAppKitAccount();

    const withdrawRaisedEvm = useCallback(
        async ({
            poolAddress,
            recipientAddress,
            amount,
        }: {
            poolAddress: string;
            recipientAddress: string;
            amount: bigint;
        }) => {
            if (!walletConnected || !walletProvider) throw new Error("Wallet not connected");

            const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
            const signer = await provider.getSigner();
            const contract = getContractLaunchpadFactory(signer);

            const tx = await contract.withdrawRaised(
                poolAddress,
                [recipientAddress],
                [amount],
            );
            const receipt = await tx.wait();

            toast.success("Raised funds withdrawn!", { description: `Tx: ${receipt.hash}` });
            return receipt.hash as string;
        },
        [walletConnected, walletProvider],
    );

    const withdrawRemainingSaleEvm = useCallback(
        async ({
            poolAddress,
            recipientAddress,
            amount,
        }: {
            poolAddress: string;
            recipientAddress: string;
            amount: bigint;
        }) => {
            if (!walletConnected || !walletProvider) throw new Error("Wallet not connected");

            const provider = new ethers.BrowserProvider(walletProvider as Eip1193Provider);
            const signer = await provider.getSigner();
            const contract = getContractLaunchpadFactory(signer);

            const tx = await contract.withdrawRemainingSale(
                poolAddress,
                [recipientAddress],
                [amount],
            );
            const receipt = await tx.wait();

            toast.success("Remaining sale tokens withdrawn!", { description: `Tx: ${receipt.hash}` });
            return receipt.hash as string;
        },
        [walletConnected, walletProvider],
    );

    return { withdrawRaisedEvm, withdrawRemainingSaleEvm };
};
