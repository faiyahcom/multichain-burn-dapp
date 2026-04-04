import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import { chainIdToNetworkConfig } from "@/config/networks";
import type { PoolDetailResponse } from "@/types/pool";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { useOnChainVaultBalance } from "@/views/admin/burn/detail/amount-activities/hooks/useOnChainVaultBalance";
import { useMemo, useState } from "react";
import { ActionBtn, StatRow } from "../../components";
import { useAmountActivity } from "../../use-amount-activity";
import { shortenNumber } from "@/utils/helpers/numbers";
import TokenDisplay from "@/components/common/token-display";

type Props = {
  poolDetail?: PoolDetailResponse;
};

const EndStatus = ({ poolDetail }: Props) => {
  const { formattedReward, formattedBurned, handleClaim } =
    useAmountActivity(poolDetail);
  const [isLoading, setIsLoading] = useState(false);
  const canClaim = poolDetail?.userAmount?.canClaim ?? false;

  const handleClaimWithLoading = async () => {
    setIsLoading(true);
    try {
      await handleClaim();
    } finally {
      setIsLoading(false);
    }
  };

  const network = poolDetail?.pool.chainId
    ? chainIdToNetworkConfig(poolDetail.pool.chainId)
    : undefined;
  const burnTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: poolDetail?.pool.tokenIn,
    tokenSymbol: poolDetail?.tokenIn?.symbol,
    tokenName: poolDetail?.tokenIn?.name,
    customName: poolDetail?.tokenIn?.customName,
    customSymbol: poolDetail?.tokenIn?.customSymbol,
    imageUri: poolDetail?.tokenIn?.imageUri,
  });
  const rewardTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: poolDetail?.pool.rewardToken,
    tokenSymbol: poolDetail?.tokenOut?.symbol,
    tokenName: poolDetail?.tokenOut?.name,
    customName: poolDetail?.tokenOut?.customName,
    customSymbol: poolDetail?.tokenOut?.customSymbol,
    imageUri: poolDetail?.tokenOut?.imageUri,
  });

  const { rewardBalance } = useOnChainVaultBalance({
    poolAddress: poolDetail?.pool.address,
    chainId: poolDetail?.pool.chainId,
    rewardToken: poolDetail?.pool.rewardToken,
    tokenIn: poolDetail?.pool.tokenIn,
    rewardTokenDecimals: poolDetail?.pool.rewardTokenDecimals,
    tokenInDecimals: poolDetail?.pool.tokenInDecimals,
    assetTypeReward: poolDetail?.pool.assetTypeReward,
    assetTypeIn: poolDetail?.pool.assetTypeIn,
  });

  const estimatedRewardNum = useMemo(() => {
    if (!poolDetail) return "-";
    const totalDeposited =
      Number(poolDetail.depositedAmount) /
      Math.pow(10, poolDetail.pool.tokenInDecimals);
    const yourCurrentDeposited =
      Number(poolDetail?.userAmount?.deposited) /
      Math.pow(10, poolDetail.pool.tokenInDecimals);
    const rewardBalanceNum = rewardBalance !== undefined
      ? Number(rewardBalance.replace(/,/g, ""))
      : 0;
    if (totalDeposited === 0 || rewardBalanceNum === 0 || yourCurrentDeposited === 0)
      return "0";
    const reward = (yourCurrentDeposited / totalDeposited) * rewardBalanceNum;
    return shortenNumber({ number: reward })?.toUpperCase() ?? "0";
  }, [poolDetail, rewardBalance]);

  return (
    <PoolChainGuard chainId={poolDetail?.pool.chainId}>
      {canClaim ? (
        <StatRow
          label="Claimable Reward"
          value={
            <div className="inline-flex items-center gap-1.5 md:gap-2.5">
              {estimatedRewardNum}
              <TokenDisplay
                symbol={poolDetail?.tokenOut?.symbol}
                customSymbol={poolDetail?.tokenOut?.customSymbol}
                imageUri={rewardTokenDisplay.imageUri ?? undefined}
                classNames={{
                  img: "size-4 md:size-5 2xl:size-5.75",
                  container: "inline-flex items-center gap-1.5 md:gap-2.5",
                }}
              />
            </div>
          }
          className="text-burn-border/85"
          valueClassName="text-xl font-bold"
        />
      ) : (
        <StatRow
          label={"Claimed Reward"}
          value={
            <div className="inline-flex items-center gap-1.5 md:gap-2.5">
              {formattedReward}
              <TokenDisplay
                symbol={poolDetail?.tokenOut?.symbol}
                customSymbol={poolDetail?.tokenOut?.customSymbol}
                imageUri={rewardTokenDisplay.imageUri ?? undefined}
                classNames={{
                  img: "size-4 md:size-5 2xl:size-5.75",
                  container: "inline-flex items-center gap-1.5 md:gap-2.5",
                }}
              />
            </div>
          }
          className="text-burn-border/85"
          valueClassName="text-xl font-bold"
        />
      )}
      <StatRow
        label="Your Burned Amount"
        value={
          <div className="inline-flex items-center gap-1 md:gap-1.5">
            {formattedBurned}
            <TokenDisplay
              symbol={poolDetail?.tokenIn?.symbol}
              customSymbol={poolDetail?.tokenIn?.customSymbol}
              imageUri={burnTokenDisplay.imageUri ?? undefined}
              classNames={{
                img: "size-3.5 md:size-4 2xl:size-4.25",
                container: "inline-flex items-center gap-1 md:gap-1.5",
              }}
            />
          </div>
        }
      />
      <ActionBtn
        letter="C"
        text={canClaim ? "Claim" : "Claimed"}
        isLoading={isLoading}
        disabled={!canClaim}
        onClick={handleClaimWithLoading}
      />
    </PoolChainGuard>
  );
};

export default EndStatus;
