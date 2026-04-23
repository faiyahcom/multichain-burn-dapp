import { useReadContract } from "wagmi";
import { useSystemStore } from "@/stores/systemStore";
import {
    MULTICHAIN_STAKE_PROGRAM_EVM_FACTORY_ADDRESS,
    MULTICHAIN_STAKE_PROGRAM_BSC_FACTORY_ADDRESS,
    MULTICHAIN_STAKE_PROGRAM_XPHERE_FACTORY_ADDRESS,
} from "@/web3";
import type { Address } from "viem";

const TOTAL_ACCRUED_ABI = [
    {
        inputs: [{ internalType: "address", name: "_pool", type: "address" }],
        name: "totalPendingReward",
        outputs: [{ internalType: "uint256", name: "pendingReward", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
] as const;

export const usePoolTotalAccruedEvm = ({
    poolAddress,
    chainId,
}: {
    poolAddress?: string;
    chainId?: string;
}) => {
    const selectedNetworkId = useSystemStore((state) => state.selectedNetworkId);

    let factoryAddress: string;
    switch (selectedNetworkId) {
        case "xphere":
            factoryAddress = MULTICHAIN_STAKE_PROGRAM_XPHERE_FACTORY_ADDRESS;
            break;
        case "binance":
            factoryAddress = MULTICHAIN_STAKE_PROGRAM_BSC_FACTORY_ADDRESS;
            break;
        default:
            factoryAddress = MULTICHAIN_STAKE_PROGRAM_EVM_FACTORY_ADDRESS;
    }

    const numericChainId = chainId ? Number(chainId) : undefined;
    const enabled = !!poolAddress && !!factoryAddress;

    const { data: rawAccrued, isLoading, refetch } = useReadContract({
        address: factoryAddress as Address,
        abi: TOTAL_ACCRUED_ABI,
        functionName: "totalPendingReward",
        args: poolAddress ? [poolAddress as Address] : undefined,
        chainId: numericChainId,
        query: {
            enabled,
            refetchInterval: 30_000,
        },
    });

    return { rawAccrued: rawAccrued ?? null, isLoading, refetch };
};
