import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import {
    getContractStakeFactory,
    getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import { ZERO_ADDRESS } from "@/config/constant";
import { getErrorMessage } from "@/utils/helpers/error-message";

export interface StakeParams {
    poolAddress: string;
    stakingToken: string;
    amountStr: string;
    decimals: number;
}

const POOL_CAPACITY_REACHED_MESSAGE =
    "The pool has reached its maximum capacity.";
const GENERIC_REVERT_MESSAGE = "Transaction reverted by contract.";

const hasStakeReplayContext = (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    ("transaction" in error || "receipt" in error);

const getStakeErrorBlockTag = (error: unknown): number | bigint | undefined => {
    if (typeof error !== "object" || error === null) return undefined;

    const receipt = (error as { receipt?: { blockNumber?: number | bigint } }).receipt;
    const blockNumber = receipt?.blockNumber;

    return typeof blockNumber === "number" || typeof blockNumber === "bigint"
        ? blockNumber
        : undefined;
};

const getStakeCallRequest = async ({
    contract,
    from,
    poolAddress,
    amount,
    value,
}: {
    contract: ethers.Contract;
    from: string;
    poolAddress: string;
    amount: bigint;
    value: bigint;
}) => ({
    to: await contract.getAddress(),
    from,
    data: contract.interface.encodeFunctionData("stake", [poolAddress, amount]),
    value,
});

const toEthCallTransaction = (
    stakeCallRequest: Awaited<ReturnType<typeof getStakeCallRequest>>,
) => ({
    to: stakeCallRequest.to,
    from: stakeCallRequest.from,
    data: stakeCallRequest.data,
    value: ethers.toQuantity(stakeCallRequest.value),
});

const recoverStakeErrorMessage = async ({
    error,
    provider,
    stakeCallRequest,
}: {
    error: unknown;
    provider: ethers.BrowserProvider;
    stakeCallRequest: Awaited<ReturnType<typeof getStakeCallRequest>>;
}) => {
    const initialMessage = getErrorMessage({ error });

    if (initialMessage !== GENERIC_REVERT_MESSAGE) {
        return initialMessage;
    }

    try {
        const blockTag = getStakeErrorBlockTag(error);

        if (blockTag === undefined) {
            await provider.call(stakeCallRequest);
        } else {
            await provider.send("eth_call", [
                toEthCallTransaction(stakeCallRequest),
                ethers.toQuantity(blockTag),
            ]);
        }

        return initialMessage;
    } catch (revertError) {
        return getErrorMessage({
            error: revertError,
            fallbackMsg: initialMessage,
        });
    }
};

export const useStakeEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const stakeEvm = useCallback(
        async ({ poolAddress, stakingToken, amountStr, decimals }: StakeParams) => {
            let provider: ethers.BrowserProvider | null = null;
            let stakeCallRequest: Awaited<ReturnType<typeof getStakeCallRequest>> | null =
                null;

            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();
                const signerAddress = await signer.getAddress();
                const amount = ethers.parseUnits(amountStr, decimals);
                const isNative = stakingToken.toLowerCase() === ZERO_ADDRESS;
                const txValue = isNative ? amount : 0n;

                const contract = getContractStakeFactory(signer);

                if (!isNative) {
                    const erc20 = getERC20Contract(stakingToken, signer);
                    const factoryAddress = ethers.getAddress(await contract.getAddress());
                    const approveTx = await erc20.approve(factoryAddress, amount);
                    await approveTx.wait();
                }

                stakeCallRequest = await getStakeCallRequest({
                    contract,
                    from: signerAddress,
                    poolAddress,
                    amount,
                    value: txValue,
                });

                await provider.call(stakeCallRequest);

                const tx = await contract.stake(poolAddress, amount, { value: txValue });
                const receipt = await tx.wait();

                toast.success("Staked successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                return receipt.hash;
            } catch (error: unknown) {
                const message =
                    provider && stakeCallRequest && hasStakeReplayContext(error)
                        ? await recoverStakeErrorMessage({
                            error,
                            provider,
                            stakeCallRequest,
                        })
                        : getErrorMessage({ error });

                if (message === POOL_CAPACITY_REACHED_MESSAGE) {
                    toast.error(`Failed to stake: ${message}`);
                } else {
                    toast.error("Failed to stake", {
                        description: message,
                    });
                }
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { stakeEvm };
};
