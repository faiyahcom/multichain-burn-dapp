import Decimal from "decimal.js";
import { formatAmount, safeDecimal } from "@/utils/helpers/numbers";
import type { PoolDetailResponse } from "@/types/pool";
import { Skeleton } from "@/components/ui/skeleton";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { chainIdToNetworkConfig } from "@/config/networks";
import { DECIMAL_FEE_PERCENT } from "../../fee-settings-management/hooks/useFeeSettings";

type Props = {
  poolDetail?: PoolDetailResponse;
};

const fmt = (raw: string | undefined, decimals: number) =>
  raw !== undefined ? formatAmount(raw, decimals) : "0";

const fmtFee = (fee: string | undefined) =>
  fee !== undefined ? `${Number(fee) / DECIMAL_FEE_PERCENT}%` : "-";

const Row = ({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) => (
  <div
    className={`flex items-center justify-between text-sm ${muted ? "text-greyed" : ""}`}
  >
    <span>{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const LaunchpadRewardAmount = ({ poolDetail }: Props) => {
  const pool = poolDetail?.pool;

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
  const claimedReward = fmt(poolDetail?.claimedRewardAmount, rewardDec);
  const totalRaised = fmt(poolDetail?.depositedAmount, paymentDec);
  const settlementFee = fmtFee(pool?.settlementFee);

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
      raisedGoal = goalHuman.toFixed(2);
      const raisedHuman = safeDecimal(poolDetail?.depositedAmount ?? "0").div(
        new Decimal(10).pow(paymentDec),
      );
      const ratio = raisedHuman.div(goalHuman.isZero() ? 1 : goalHuman);
      progressPct = Math.min(100, ratio.mul(100).toNumber());
    } catch {
      progressPct = 0;
    }
  }

  // Distribution mode message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const launchpadPool = pool as any;
  const isInstant = launchpadPool?.isInstant as boolean | undefined;
  const isAuto = launchpadPool?.isAuto as boolean | undefined;

  const distributionMsg = isInstant
    ? "Rewards are distributed instantly upon deposit."
    : isAuto
      ? "Rewards will be automatically distributed after the pool ends."
      : isAuto === false
        ? "Users can claim rewards after the pool ends."
        : null;

  const isNegativeRemaining = safeDecimal(
    pool?.currentRewardAmount ?? "0",
  ).isNegative();

  if (!poolDetail) {
    return (
      <div className="mt-3 w-full space-y-3 py-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-black" />
          <Skeleton className="h-6 w-40" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 w-full space-y-3 py-4">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 bg-black" />
        <span className="text-xl font-medium">Reward Amount</span>
        <span className="ml-auto text-lg font-semibold">
          {totalReward} {saleSymbol}
        </span>
      </div>

      <Row
        label="Total Reward Pool"
        value={`${totalReward} ${saleSymbol}`}
        muted
      />
      <Row
        label="Claimed / Distributed"
        value={`${claimedReward} ${saleSymbol}`}
        muted
      />
      <Row
        label="Remaining Reward"
        value={
          <span className={isNegativeRemaining ? "text-red-500" : ""}>
            {currentReward} {saleSymbol}
          </span>
        }
        muted
      />
      <Row
        label="Total Raised"
        value={`${totalRaised} ${paymentSymbol}`}
        muted
      />
      <Row label="Settlement Fee" value={settlementFee} muted />

      {!isDynamic && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-greyed">
            <span>
              {fmt(poolDetail?.depositedAmount, paymentDec)} {paymentSymbol}
            </span>
            <span>
              {raisedGoal} {paymentSymbol}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-progress-bg">
            <div
              className="h-full rounded-full bg-mb-btn-stake transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-right text-xs text-greyed">
            {progressPct.toFixed(1)}%
          </p>
        </div>
      )}

      {distributionMsg && (
        <p className="rounded-md bg-progress-bg px-3 py-2 text-xs text-greyed">
          {distributionMsg}
        </p>
      )}

      {pool?.status === "ended" || pool?.status === "closed" ? (
        <p className="rounded-md bg-progress-bg px-3 py-2 text-xs">
          This pool has completed. No further deposits are accepted.
        </p>
      ) : null}
    </div>
  );
};

export default LaunchpadRewardAmount;
