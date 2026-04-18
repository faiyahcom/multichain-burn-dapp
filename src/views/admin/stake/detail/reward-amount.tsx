import { formatAmount } from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";
import { Skeleton } from "@/components/ui/skeleton";
import type { VaultBalance } from "./amount-activities/hooks/useOnChainVaultBalance";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import { DECIMAL_FEE_PERCENT } from "../../fee-settings-management/hooks/useFeeSettings";
import { useMediaQuery } from "usehooks-ts";

type Props = {
    poolDetail?: PoolDetailResponse;
    vaultBalance?: VaultBalance;
};

const fmt = (raw: string | undefined, decimals: number) =>
    raw !== undefined ? formatAmount(raw, decimals) : "0";

const fmtFee = (fee: string | undefined) =>
    fee !== undefined ? `${Number(fee) / DECIMAL_FEE_PERCENT}%` : "-";

const StakedRewardAmount = ({ poolDetail, vaultBalance }: Props) => {
    const pool = poolDetail?.pool;
    const status = (pool?.status ?? "draft") as string;
    const isSimple = false;
    const isMobile = useMediaQuery("(max-width: 640px)");

    const network = pool?.chainId ? chainIdToNetworkConfig(pool.chainId) : undefined;

    const stakingTokenDisplay = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.tokenIn,
        tokenSymbol: poolDetail?.tokenIn?.symbol,
        tokenName: poolDetail?.tokenIn?.name,
        customName: poolDetail?.tokenIn?.customName,
        customSymbol: poolDetail?.tokenIn?.customSymbol,
        imageUri: poolDetail?.tokenIn?.imageUri,
    });
    const rewardTokenDisplayObj = resolvePoolTokenDisplay({
        network,
        tokenAddress: pool?.rewardToken,
        tokenSymbol: poolDetail?.tokenOut?.symbol,
        tokenName: poolDetail?.tokenOut?.name,
        customName: poolDetail?.tokenOut?.customName,
        customSymbol: poolDetail?.tokenOut?.customSymbol,
        imageUri: poolDetail?.tokenOut?.imageUri,
    });

    const rewardSymbol = rewardTokenDisplayObj.symbol;
    const stakingSymbol = stakingTokenDisplay.symbol;
    const rewardDec = pool?.rewardTokenDecimals ?? 0;
    const stakingDec = pool?.tokenInDecimals ?? 0;

    // Reward amount header value
    const formattedTotalReward = fmt(pool?.rewardAmount, rewardDec)?.toUpperCase();

    // Settlement fee
    const settlementFee = fmtFee(pool?.settlementFee);

    // Staking balances — from API staking object
    const staking = poolDetail?.staking;
    const formattedTotalStaked = fmt(staking?.totalStaked, stakingDec);
    // API has a typo: "totatClaimed" (missing 'l')
    const formattedClaimedReward = fmt(staking?.user?.totatClaimed, rewardDec);
    // depositedRewards not in new API — fall back to pool rewardAmount
    const formattedDepositedRewards = fmt(pool?.rewardAmount, rewardDec);

    // Current vault balances (live)
    const formattedRewardRemaining =
        vaultBalance?.rewardBalance ?? fmt(pool?.currentRewardAmount, rewardDec);

    const extendedRows = [
        [
            { label: "Total Staked Amount", value: `${formattedTotalStaked} ${stakingSymbol}` },
            { label: "Total Claimed Rewards", value: `${formattedClaimedReward} ${rewardSymbol}` },
        ],
        [
            { label: "Total Reward Amount", value: `${formattedRewardRemaining} ${rewardSymbol}` },
            { label: "Total Deposited Rewards", value: `${formattedDepositedRewards} ${rewardSymbol}` },
        ],
        [
            {
                label: "Settlement Fee",
                value: (
                    <span className="inline-flex flex-col gap-1 text-xl text-foreground sm:flex-row sm:items-center">
                        {settlementFee}{" "}
                        <span className="text-sm whitespace-nowrap">
                            ({isMobile ? "system collected" : "collected by the system"})
                        </span>
                    </span>
                ),
            },
            null,
        ],
    ];

    return (
        <div className="mt-3 w-full py-4">
            <div className="flex items-center gap-1 pb-4 text-xl font-medium max-sm:justify-between md:gap-14">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-foreground" />
                    <span>Staked and Reward Amount</span>
                </div>
                {/* <p>
                    {!poolDetail ? (
                        <Skeleton className="inline-block h-6 w-28" />
                    ) : (
                        <>
                            {formattedTotalReward} {rewardSymbol}
                        </>
                    )}
                </p> */}
            </div>

            {isSimple ? (
                <div className="space-y-2">
                    <div className="grid grid-cols-1 space-x-2 sm:grid-cols-2">
                        <div className="grid grid-cols-2">
                            <span className="text-xl text-greyed">Settlement Fee:</span>
                            <span className="inline-flex flex-col gap-1 text-xl text-foreground max-sm:text-right sm:flex-row sm:items-center">
                                {!poolDetail ? (
                                    <Skeleton className="h-5 w-16" />
                                ) : (
                                    <>
                                        {settlementFee}{" "}
                                        <span className="text-sm">
                                            ({isMobile ? "system collected" : "collected by the system"})
                                        </span>
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    {extendedRows.map((row, i) => (
                        <div className="grid grid-cols-1 space-x-2 sm:grid-cols-2" key={i}>
                            <div className="grid grid-cols-2">
                                <span className="text-xl text-greyed">{row?.[0]?.label}:</span>
                                <span className="text-xl text-foreground max-sm:text-right">
                                    {!poolDetail ? <Skeleton className="h-5 w-24" /> : row?.[0]?.value}
                                </span>
                            </div>
                            {row?.[1] && (
                                <div className="grid grid-cols-2">
                                    <span className="text-xl text-greyed">{row[1].label}:</span>
                                    <span className="text-xl text-foreground max-sm:text-right">
                                        {!poolDetail ? <Skeleton className="h-5 w-24" /> : row[1].value}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StakedRewardAmount;
