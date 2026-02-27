import { useCallback } from "react";
import { toast } from "sonner";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import MULTICHAIN_BURN_ABI from "@/web3/contracts/multichain_burn_abi_evm.json";

const CONTRACT_ADDRESS = "0x13BE6f130b53D7cd54Ab7A6351f4A5c940D18eBE";
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
            ratio,
        }: {
            poolName: string;
            tokenReward: string;
            tokenIn: string;
            rewardAmount: number;
            ratio: "1:1" | "fixed";
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

                const contract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    MULTICHAIN_BURN_ABI,
                    signer,
                );

                const rewardIsNative = isNativeToken(tokenReward);
                const depositIsNative = isNativeToken(tokenIn);

                const rewardAssetType = rewardIsNative
                    ? AssetType.NATIVE
                    : AssetType.ERC20;

                const depositAssetType = depositIsNative
                    ? AssetType.NATIVE
                    : AssetType.ERC20;

                const parsedAmount = ethers.parseUnits(rewardAmount.toString(), 18);

                // -----------------------
                // ERC20 Approve if needed
                // -----------------------
                if (!rewardIsNative) {
                    const tokenContract = new ethers.Contract(
                        tokenReward,
                        [
                            "function approve(address spender, uint256 amount) external returns (bool)",
                        ],
                        signer,
                    );

                    await tokenContract.approve(CONTRACT_ADDRESS, parsedAmount);
                }

                const poolNameBytes32 = ethers.encodeBytes32String(poolName.slice(0, 31));

                const rewardNumerator = ratio === "1:1" ? BigInt(1) : BigInt(0);

                const rewardDenominator = BigInt(1);

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

                return receipt.hash;
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
