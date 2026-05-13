import { useCallback } from "react";
import { toast } from "@/components/common/custom-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { ethers, type Eip1193Provider } from "ethers";
import {
    getContractLaunchpadFactory,
    getERC20Contract,
} from "@/web3/contracts/multichainBurnContractEVM";
import { DEFAULT_NATIVE_DECIMALS, ZERO_ADDRESS } from "@/config/constant";
import { getDecimalsTokenNativeByChainId } from "@/config/networks";
import { getErrorMessage } from "@/utils/helpers/error-message";
import { assertSufficientNativeBalanceForTransaction } from "@/utils/helpers/evm-gas";
import { isNativeToken } from "@/hooks/useTokenBalance";
import type { CreateLaunchpadPoolSolParams } from "./useCreateLaunchpadPoolSolFn";

export type CreateLaunchpadPoolEvmParams = CreateLaunchpadPoolSolParams;

/** Price precision base — 4 decimal places, matches Solana RATIO_DENOMINATOR */
const RATIO_DENOMINATOR = 10_000n;

// Enum orderings (must match ILaunchpadPool Solidity enums)
const LaunchpadPoolType = { Dynamic: 0, Fixed: 1 } as const;
const ClaimPolicy = { Instant: 0, AfterEnd: 1 } as const;
const DistributionMode = { None: 0, Automatic: 1, Claim: 2 } as const;

const normalizeAddress = (address: string) =>
    isNativeToken(address) ? ZERO_ADDRESS : ethers.getAddress(address);

export const useCreateLaunchpadPoolEvmFn = () => {
    const { isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider("eip155");

    const createPool = useCallback(
        async (
            params: CreateLaunchpadPoolEvmParams,
        ): Promise<string | undefined> => {
            try {
                if (!isConnected || !walletProvider) {
                    throw new Error("Wallet not connected");
                }

                const provider = new ethers.BrowserProvider(
                    walletProvider as Eip1193Provider,
                );
                const signer = await provider.getSigner();
                const userAddress = await signer.getAddress();

                const contract = getContractLaunchpadFactory(signer);
                const contractAddress = await contract.getAddress();

                const saleIsNative = isNativeToken(params.saleToken);

                // 1. Resolve decimals
                const chainId = Number((await provider.getNetwork()).chainId);
                const nativeDecimals =
                    getDecimalsTokenNativeByChainId(chainId)?.decimals ??
                    DEFAULT_NATIVE_DECIMALS;

                let saleDecimals = nativeDecimals;
                if (!saleIsNative) {
                    const code = await provider.getCode(params.saleToken);
                    if (code === "0x")
                        throw new Error(
                            `Sale token address has no contract on this network: ${params.saleToken}`,
                        );
                    saleDecimals = Number(
                        await getERC20Contract(params.saleToken, signer).decimals(),
                    );
                }

                // 2. Parse total sale amount (budget)
                const totalSaleAmount = ethers.parseUnits(
                    params.budget || "0",
                    saleDecimals,
                );

                // 3. Build ratio
                //    Fixed:   saleRate = RATIO_DENOMINATOR (> 0), depositRate = price × RATIO_DENOMINATOR (> 0)
                //    Dynamic: saleRate = 0, depositRate = 0
                const isFixed = params.mode === "fixed";
                const saleRate = isFixed ? RATIO_DENOMINATOR : 0n;
                const depositRate = isFixed
                    ? BigInt(
                        Math.round(
                            Number(params.price ?? "0") * Number(RATIO_DENOMINATOR),
                        ),
                    )
                    : 0n;

                // 4. Enum values
                const poolType = isFixed
                    ? LaunchpadPoolType.Fixed
                    : LaunchpadPoolType.Dynamic;

                const claimPolicy =
                    params.claimPolicy === "instant"
                        ? ClaimPolicy.Instant
                        : ClaimPolicy.AfterEnd;

                // Fixed + Instant → None (0); Fixed/Dynamic + AfterEnd → Automatic (1) or Claim (2)
                const distributionMode =
                    params.claimPolicy === "instant"
                        ? DistributionMode.None
                        : params.claimPolicy === "after_end_auto"
                            ? DistributionMode.Automatic
                            : DistributionMode.Claim;

                // 5. Build payload
                const payload = {
                    name: ethers.encodeBytes32String(params.poolName.slice(0, 31)),
                    saleToken: normalizeAddress(params.saleToken),
                    paymentToken: normalizeAddress(params.paymentToken),
                    totalSaleAmount,
                    saleRate,
                    depositRate,
                    startTime: BigInt(Math.floor(params.startTime.getTime() / 1000)),
                    endTime: BigInt(Math.floor(params.endTime.getTime() / 1000)),
                    poolType,
                    claimPolicy,
                    distributionMode,
                    submitPool: !params.isDraft,
                };

                console.log("Create Launchpad Pool EVM Payload:", payload);

                // 6. Approve sale token if not native — only required when submitting (not draft)
                if (!params.isDraft && totalSaleAmount > 0n && !saleIsNative) {
                    const saleTokenContract = getERC20Contract(params.saleToken, signer);

                    const balance: bigint =
                        await saleTokenContract.balanceOf(userAddress);
                    if (balance < totalSaleAmount) {
                        throw new Error(
                            `Insufficient sale token balance. Required: ${ethers.formatUnits(totalSaleAmount, saleDecimals)}`,
                        );
                    }

                    const allowance: bigint = await saleTokenContract.allowance(
                        userAddress,
                        contractAddress,
                    );
                    if (allowance < totalSaleAmount) {
                        const approveTx = await saleTokenContract.approve(
                            contractAddress,
                            totalSaleAmount,
                        );
                        await approveTx.wait();
                    }
                }

                // 7. Gas check + send
                // Draft: no token transfer, so no native value sent; tokens are charged only on submit
                const nativeValue = !params.isDraft && saleIsNative ? totalSaleAmount : 0n;
                await assertSufficientNativeBalanceForTransaction({
                    provider,
                    address: userAddress,
                    txValue: nativeValue,
                    estimateGas: () =>
                        contract.createPool.estimateGas(payload, { value: nativeValue }),
                });

                const createTx = await contract.createPool(payload, {
                    value: nativeValue,
                });
                const createReceipt = await createTx.wait();

                // 8. Parse pool address from LaunchpadPoolCreated event
                const poolCreatedLog = createReceipt?.logs
                    ?.map((log: { topics: readonly string[]; data: string }) => {
                        try {
                            return contract.interface.parseLog({
                                topics: log.topics as string[],
                                data: log.data,
                            });
                        } catch {
                            return null;
                        }
                    })
                    .find(
                        (parsed: { name: string } | null) =>
                            parsed?.name === "LaunchpadPoolCreated",
                    );

                const poolAddress: string | undefined = poolCreatedLog?.args?.pool;

                if (!poolAddress) {
                    throw new Error("Could not determine pool address from transaction");
                }

                toast.success(
                    params.isDraft
                        ? "Launchpad pool saved as draft!"
                        : "Launchpad pool created!",
                    { description: `Tx: ${createReceipt.hash}` },
                );

                return poolAddress;
            } catch (error: unknown) {
                console.error(error);
                toast.error("Create launchpad pool failed", {
                    description: getErrorMessage({ error }),
                });
                throw error;
            }
        },
        [isConnected, walletProvider],
    );

    return { createPool };
};
