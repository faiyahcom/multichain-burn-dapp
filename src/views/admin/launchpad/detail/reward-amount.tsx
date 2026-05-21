import Decimal from "decimal.js";
import {
  formatAmount,
  safeDecimal,
  shortenNumber,
} from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";
import { Skeleton } from "@/components/ui/skeleton";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import { DECIMAL_FEE_PERCENT } from "../../fee-settings-management/hooks/useFeeSettings";
import { BN } from "bn.js";

type Props = {
  poolDetail?: PoolDetailResponse;
};

const SIMPLE_STATUSES = ["pending", "upcoming", "holding", "draft"];

const fmt = (raw: string | undefined, decimals: number) =>
  raw !== undefined ? formatAmount(raw, decimals) : "0";

const fmtFee = (fee: string | undefined) =>
  fee !== undefined ? `${Number(fee) / DECIMAL_FEE_PERCENT}%` : "-";

const LaunchpadRewardAmount = ({ poolDetail }: Props) => {
  const pool = poolDetail?.pool;
  const status = pool?.status ?? "upcoming";
  const isSimple = SIMPLE_STATUSES.includes(status);

  const network = pool?.chainId
    ? chainIdToNetworkConfig(pool.chainId)
    : undefined;

  const saleTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: pool?.rewardToken,
    tokenSymbol: poolDetail?.tokenOut?.symbol,
    tokenName: poolDetail?.tokenOut?.name,
    customName: poolDetail?.tokenOut?.customName,
    customSymbol: poolDetail?.tokenOut?.customSymbol,
    imageUri: poolDetail?.tokenOut?.imageUri,
  });

  const paymentTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: pool?.tokenIn,
    tokenSymbol: poolDetail?.tokenIn?.symbol,
    tokenName: poolDetail?.tokenIn?.name,
    customName: poolDetail?.tokenIn?.customName,
    customSymbol: poolDetail?.tokenIn?.customSymbol,
    imageUri: poolDetail?.tokenIn?.imageUri,
  });

  const saleSymbol = saleTokenDisplay.symbol;
  const paymentSymbol = paymentTokenDisplay.symbol;
  const rewardDec = pool?.rewardTokenDecimals ?? 0;
  const paymentDec = pool?.tokenInDecimals ?? 0;

  const totalReward = fmt(pool?.rewardAmount, rewardDec);
  const currentReward = fmt(pool?.currentRewardAmount, rewardDec);
  const claimedReward = fmt(
    new BN(poolDetail?.launchpad?.claimed ?? "0")
      .add(new BN(poolDetail?.launchpad?.distributed ?? "0"))
      .toString(),
    rewardDec,
  );
  const totalRaised = fmt(poolDetail?.launchpad?.totalRaised, paymentDec);
  const settlementFee = fmtFee(pool?.settlementFee);
  const collectedFee = fmt(pool?.settlementFeeTotal, rewardDec);

  // Fixed mode: rewardDenominator = on-chain ratioBps, rewardNumerator = ratioDenominator
  const isDynamic =
    !pool?.rewardDenominator || Number(pool.rewardDenominator) === 0;

  // Progress bar for Fixed mode: totalRaised / goal
  // Goal = rewardAmount (sale tokens) * price (payment per sale)
  // price = ratioBps / ratioDenominator = rewardDenominator / rewardNumerator
  let progressPct = 0;
  let raisedGoal = "0";
  if (!isDynamic && pool) {
    try {
      const price = new Decimal(pool.rewardDenominator).div(
        new Decimal(pool.rewardNumerator),
      );
      const rewardHuman = safeDecimal(pool.rewardAmount).div(
        new Decimal(10).pow(rewardDec),
      );
      const goalHuman = rewardHuman.mul(price);
      raisedGoal = shortenNumber({ number: goalHuman.toNumber() });
      const raisedHuman = safeDecimal(
        poolDetail?.launchpad?.totalRaised ?? "0",
      ).div(new Decimal(10).pow(paymentDec));
      // If remaining capacity has 6+ zeros after decimal (< 0.000001),
      // treat as fully filled given the 6-decimal input limit
      const remaining = goalHuman.sub(raisedHuman);
      if (remaining.lte(0) || remaining.lt(new Decimal("0.000001"))) {
        progressPct = 100;
      } else {
        const ratio = raisedHuman.div(goalHuman.isZero() ? 1 : goalHuman);
        progressPct = Math.min(100, ratio.mul(100).toNumber());
      }
    } catch {
      progressPct = 0;
    }
  }

  const isNegativeRemaining = safeDecimal(
    pool?.currentRewardAmount ?? "0",
  ).isNegative();

  const extendedRows = [
    [
      {
        label: "Total Reward Pool",
        value: `${totalReward} ${saleSymbol}`,
      },
      {
        label: "Claimed / Distributed",
        value: `${claimedReward} ${saleSymbol}`,
      },
    ],
    [
      {
        label: "Remaining Reward",
        value: (
          <span className={isNegativeRemaining ? "text-red-500" : ""}>
            {currentReward} {saleSymbol}
          </span>
        ),
      },
      {
        label: "Total Raised",
        value: `${totalRaised} ${paymentSymbol}`,
      },
    ],
    [
      { label: "Settlement Fee", value: settlementFee },
      {
        label: "Collected Fee",
        value: `${collectedFee} ${saleSymbol}`,
      },
    ],
  ];

  if (!poolDetail) {
    return (
      <div className="mt-3 w-full py-4">
        <div className="flex items-center gap-1 pb-4 text-xl font-medium max-sm:justify-between md:gap-14">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-foreground" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 space-x-2 sm:grid-cols-2">
              <div className="grid grid-cols-2 items-center gap-y-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="grid grid-cols-2 items-center gap-y-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 w-full py-4">
      <div className="flex items-center gap-1 pb-4 text-xl font-medium max-sm:justify-between md:gap-14">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-foreground" />
          <span>Reward Amount</span>
        </div>
      </div>

      {isSimple ? (
        <div className="space-y-2">
          <div className="grid grid-cols-1 space-x-2 sm:grid-cols-2">
            <div className="grid grid-cols-2">
              <span className="text-xl text-greyed">Total Reward Pool:</span>
              <span className="text-xl text-foreground max-sm:text-right">
                {totalReward} {saleSymbol}
              </span>
            </div>
            <div className="grid grid-cols-2">
              <span className="text-xl text-greyed">Settlement Fee:</span>
              <span className="text-xl text-foreground max-sm:text-right">
                {settlementFee}
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
                  {row?.[0]?.value}
                </span>
              </div>
              {row?.[1] && (
                <div className="grid grid-cols-2">
                  <span className="text-xl text-greyed">{row[1].label}:</span>
                  <span className="text-xl text-foreground max-sm:text-right">
                    {row[1].value}
                  </span>
                </div>
              )}
            </div>
          ))}

          {!isDynamic && pool?.status !== "canceled" && (
            <div className="space-y-1">
              <div className="flex justify-end text-xl">
                <span>
                  {fmt(poolDetail?.launchpad?.totalRaised, paymentDec)}{" "}
                  {paymentSymbol}
                </span>
                /
                <span>
                  {raisedGoal} {paymentSymbol}
                </span>
                <span>
                  &nbsp;(
                  {shortenNumber({ number: progressPct })}
                  %)
                </span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-progress-bg">
                <div
                  className="h-full rounded-full bg-active transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* {distributionMsg && (
            <p className="rounded-md bg-progress-bg px-3 py-2 text-xs text-greyed">
              {distributionMsg}
            </p>
          )} */}
        </div>
      )}
    </div>
  );
};

export default LaunchpadRewardAmount;
