import { useCallback } from "react";
import { toast } from "sonner";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider, type Log } from "ethers";
import { MULTICHAIN_BURN_PROGRAM_EVM_ADDRESS } from "@/web3";
import {
    getERC20Contract,
    getMultichainBurnContract,
} from "@/web3/contracts/multichainBurnContractEVM";

const CONTRACT_ADDRESS = MULTICHAIN_BURN_PROGRAM_EVM_ADDRESS;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const AssetType = {
    ERC20: 0,
    NATIVE: 3,
} as const;

const isNativeToken = (address: string) => {
    return (
        !address || address === ZERO_ADDRESS || address.toLowerCase() === "native"
    );
};

export const useCreateSwapPoolEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const createPool = useCallback(
        async ({
            poolName,
            tokenReward,
            tokenIn,
            rewardAmount,
            ratioNumerator,
            ratioDenominator,
        }: {
            poolName: string;
            tokenReward: string;
            tokenIn: string;
            rewardAmount: number;
            ratioNumerator: number;
            ratioDenominator: number;
        }) => {
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
                const userAddress = await signer.getAddress();

                const contract = getMultichainBurnContract(signer);

                const rewardIsNative = isNativeToken(tokenReward);
                const depositIsNative = isNativeToken(tokenIn);

                const rewardAssetType = rewardIsNative
                    ? AssetType.NATIVE
                    : AssetType.ERC20;

                const depositAssetType = depositIsNative
                    ? AssetType.NATIVE
                    : AssetType.ERC20;

                // Determine token decimals on-chain (for ERC20)
                let rewardDecimals = 18;
                let parsedAmount: bigint;

                if (rewardIsNative) {
                    parsedAmount = ethers.parseUnits(
                        rewardAmount.toString(),
                        rewardDecimals,
                    );
                } else {
                    const tokenContract = getERC20Contract(tokenReward, signer);

                    const decimals = await tokenContract.decimals();
                    rewardDecimals = Number(decimals);

                    parsedAmount = ethers.parseUnits(
                        rewardAmount.toString(),
                        rewardDecimals,
                    );

                    const approveTx = await tokenContract.approve(
                        CONTRACT_ADDRESS,
                        parsedAmount,
                    );

                    const approveTxReceipt = await approveTx.wait();
                    console.log("approveTxReceipt", approveTxReceipt);
                }

                const poolNameBytes32 = ethers.encodeBytes32String(
                    poolName.slice(0, 31),
                );

                const rewardNumerator = BigInt(ratioNumerator);
                const rewardDenominator = BigInt(ratioDenominator);

                const payload = {
                    poolName: poolNameBytes32,
                    projectOwner: userAddress,
                    tokenReward: rewardIsNative ? ZERO_ADDRESS : tokenReward,
                    assetTypeReward: rewardAssetType,
                    tokenIn: depositIsNative ? ZERO_ADDRESS : tokenIn,
                    assetTypeIn: depositAssetType,
                    targetAddress: userAddress,
                    rewardNumerator,
                    rewardDenominator,
                    rewardAmount: parsedAmount,
                };

                const tx = await contract.createSwapPool(payload, {
                    value: rewardIsNative ? parsedAmount : 0n,
                });

                const receipt = await tx.wait();

                toast.success("Pool created successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                const poolDeployedLog = receipt?.logs?.find((log: Log) => {
                    try {
                        const parsed = contract.interface.parseLog({
                            topics: log.topics as string[],
                            data: log.data,
                        });
                        return parsed?.name === "PoolSwapDeployed";
                    } catch {
                        return false;
                    }
                });
                const poolAddress =
                    poolDeployedLog &&
                    contract.interface.parseLog({
                        topics: poolDeployedLog.topics as string[],
                        data: poolDeployedLog.data,
                    })?.args?.pool;

                return poolAddress;
            } catch (error: any) {
                toast.error("Failed to create pool", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { createPool };
};
