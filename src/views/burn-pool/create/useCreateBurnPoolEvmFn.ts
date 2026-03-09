import { useCallback } from "react";
import { toast } from "sonner";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider, type Log } from "ethers";
import {
    getContractBurnFactory,
} from "@/web3/contracts/multichainBurnContractEVM";
import { ZERO_ADDRESS } from "@/config/constant";


const isNativeToken = (address: string) =>
    !address || address === ZERO_ADDRESS || address.toLowerCase() === "native";

const normalizeAddress = (address: string) =>
    isNativeToken(address) ? ZERO_ADDRESS : ethers.getAddress(address);

export const useCreateBurnPoolEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const createPool = useCallback(
        async ({
            poolName,
            tokenBurn,
            tokenReward,
            startTime,
            endTime,
        }: {
            poolName: string;
            tokenBurn: string;
            tokenReward: string;
            startTime: Date;
            endTime: Date;
        }) => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();

                const contract = getContractBurnFactory(signer);

                // Fetch the creation fee required by the contract
                const creationFee: bigint = await contract.creationFee();

                const poolNameBytes32 = ethers.encodeBytes32String(
                    poolName.slice(0, 31),
                );

                const payload = {
                    name: poolNameBytes32,
                    burnToken: normalizeAddress(tokenBurn),
                    rewardToken: normalizeAddress(tokenReward),
                    startTime: BigInt(Math.floor(startTime.getTime() / 1000)),
                    endTime: BigInt(Math.floor(endTime.getTime() / 1000)),
                };

                const tx = await contract.createBurnPool(payload, {
                    value: creationFee,
                });

                const receipt = await tx.wait();

                toast.success("Burn pool created successfully!", {
                    description: `Tx: ${receipt.hash}`,
                });

                // PoolCreated event: pool (indexed), by (indexed), params, time
                // Indexed args are encoded in topics, so pool address is in topics[1]
                const poolCreatedLog = receipt?.logs?.find((log: Log) => {
                    try {
                        const parsed = contract.interface.parseLog({
                            topics: log.topics as string[],
                            data: log.data,
                        });
                        return parsed?.name === "PoolCreated";
                    } catch {
                        return false;
                    }
                });

                const poolAddress =
                    poolCreatedLog &&
                    contract.interface.parseLog({
                        topics: poolCreatedLog.topics as string[],
                        data: poolCreatedLog.data,
                    })?.args?.pool;

                return poolAddress as string | undefined;
            } catch (error: any) {
                toast.error("Failed to create burn pool", {
                    description: error?.message || String(error),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { createPool };
};
