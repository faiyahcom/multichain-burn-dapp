import { formatAmount } from "@/utils/helpers/numbers";
import type { BurnPoolStatus, PoolDetailResponse } from "@/types/pool";
import { Skeleton } from "@/components/ui/skeleton";
import type { VaultBalance } from "./amount-activities/hooks/useOnChainVaultBalance";
import { chainIdToNetworkConfig, type nativeCurrency } from "@/config/networks";
import NetworkImgIcon from "@/components/common/network-img-icon";
import { resolvePoolTokenDisplay } from "@/utils/helpers/pool-token-display";
import { DECIMAL_FEE_PERCENT } from "../../fee-settings-management/hooks/useFeeSettings";
import { useMediaQuery } from "usehooks-ts";

type Props = {
  poolDetail?: PoolDetailResponse;
  vaultBalance?: VaultBalance;
};

const SIMPLE_STATUSES: BurnPoolStatus[] = [
  "pending",
  "upcoming",
  "holding",
  "draft",
];

const fmt = (raw: string | undefined, decimals: number) =>
  raw !== undefined ? formatAmount(raw, decimals) : "-";

const fmtFee = (fee: string | undefined) =>
  fee !== undefined ? `${Number(fee) / DECIMAL_FEE_PERCENT}%` : "-";

const RewardAmount = ({ poolDetail, vaultBalance }: Props) => {
  const status = (poolDetail?.pool?.status ?? "on_going") as BurnPoolStatus;
  const isSimple = SIMPLE_STATUSES.includes(status);
  const isMobile = useMediaQuery("(max-width: 640px)");

  const network = poolDetail?.pool?.chainId
    ? chainIdToNetworkConfig(poolDetail?.pool?.chainId)
    : undefined;
  const burnTokenDisplay = resolvePoolTokenDisplay({
    network,
    tokenAddress: poolDetail?.pool?.tokenIn,
    tokenSymbol: poolDetail?.tokenIn?.symbol,
    tokenName: poolDetail?.tokenIn?.name,
    customName: poolDetail?.tokenIn?.customName,
    customSymbol: poolDetail?.tokenIn?.customSymbol,
    imageUri: poolDetail?.tokenIn?.imageUri,
  });
  const rewardTokenDisplayObj = resolvePoolTokenDisplay({
    network,
    tokenAddress: poolDetail?.pool?.rewardToken,
    tokenSymbol: poolDetail?.tokenOut?.symbol,
    tokenName: poolDetail?.tokenOut?.name,
    customName: poolDetail?.tokenOut?.customName,
    customSymbol: poolDetail?.tokenOut?.customSymbol,
    imageUri: poolDetail?.tokenOut?.imageUri,
  });

  const nativeCurrencyInfo = network?.appKitNetwork.nativeCurrency as
    | nativeCurrency
    | undefined;
  const nativeDecimals = nativeCurrencyInfo?.decimals ?? 18;
  const nativeSymbol = nativeCurrencyInfo?.symbol ?? "";

  const rewardSymbol = rewardTokenDisplayObj.symbol;
  const burnSymbol = burnTokenDisplay.symbol;
  const rewardDec = poolDetail?.pool?.rewardTokenDecimals ?? 0;
  const burnDec = poolDetail?.pool?.tokenInDecimals ?? 0;

  const formattedReward = fmt(
    poolDetail?.pool?.currentRewardAmount,
    rewardDec,
  )?.toUpperCase();
  const formattedClaimed = fmt(poolDetail?.claimedRewardAmount, rewardDec);
  const formattedRemaining =
    vaultBalance?.rewardBalance ??
    fmt(poolDetail?.pool?.currentRewardAmount, rewardDec);
  const formattedBurn =
    vaultBalance?.depositBalance ?? fmt(poolDetail?.depositedAmount, burnDec);
  const settlementFee = fmtFee(poolDetail?.pool?.settlementFee);
  const creationFee =
    poolDetail?.pool?.poolCreationFee !== undefined ? (
      <span className="inline-flex items-center gap-1">
        {formatAmount(poolDetail?.pool?.poolCreationFee, nativeDecimals)}
        {network && (
          <NetworkImgIcon
            src={network.iconSrc}
            alt={nativeSymbol}
            className="size-4"
          />
        )}
        <span>{nativeSymbol}</span>
      </span>
    ) : (
      "-"
    );

  const extendedRows = [
    [
      { label: "Total Claimed", value: `${formattedClaimed} ${rewardSymbol}` },
      {
        label: "Remaining Reward",
        value: `${formattedRemaining} ${rewardSymbol}`,
      },
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
    [
      { label: "Creation Fee", value: creationFee },
      { label: "Burn Amount", value: `${formattedBurn} ${burnSymbol}` },
    ],
  ];

  return (
    <div className="mt-3 w-full py-4">
      <div className="flex items-center gap-1 pb-4 text-xl font-medium max-sm:justify-between md:gap-14">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-foreground" />
          <span>Reward Amount</span>
        </div>
        <p>
          {!poolDetail ? (
            <Skeleton className="inline-block h-6 w-28" />
          ) : (
            <>
              {formattedReward} {rewardSymbol}
            </>
          )}
        </p>
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
                      (
                      {isMobile
                        ? "system collected"
                        : "collected by the system"}
                      )
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 space-x-2 sm:grid-cols-2">
            <div className="grid grid-cols-2">
              <span className="text-xl text-greyed">Creation Fee:</span>
              <span className="text-xl text-foreground max-sm:text-right">
                {!poolDetail ? <Skeleton className="h-5 w-12" /> : creationFee}
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
                  {!poolDetail ? (
                    <Skeleton className="h-5 w-24" />
                  ) : (
                    row?.[0]?.value
                  )}
                </span>
              </div>
              {row?.[1] && (
                <div className="grid grid-cols-2">
                  <span className="text-xl text-greyed">{row[1].label}:</span>
                  <span className="text-xl text-foreground max-sm:text-right">
                    {!poolDetail ? (
                      <Skeleton className="h-5 w-24" />
                    ) : (
                      row[1].value
                    )}
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

export default RewardAmount;
