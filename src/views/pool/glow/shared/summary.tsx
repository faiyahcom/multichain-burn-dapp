import GlowSummaryCard from "@/components/common/glow/summary-card";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { PoolKindCodeEnum, type PoolKindCode } from "@/types/pool";
import { useQuery } from "@tanstack/react-query";
import { getPoolGlowVariant } from "./helpers";
import { formatAmount, shortenNumber } from "@/utils/helpers/numbers";
import { useMemo } from "react";

interface Props {
  poolKind: PoolKindCode;
}

const PoolListGlowSummary = ({ poolKind }: Props) => {
  const { data: overallStats } = useQuery({
    queryKey: poolQueryKeys.stats(poolKind),
    queryFn: () => poolService.getPoolStats(poolKind),
  });
  const variant = getPoolGlowVariant(poolKind);

  const totalVolume = useMemo(() => {
    let totalVolume = "";
    switch (poolKind) {
      case PoolKindCodeEnum.Burn:
        totalVolume = overallStats?.totalBurned ?? "0";
        break;

      case PoolKindCodeEnum.Swap:
        totalVolume = overallStats?.totalSwapVolume ?? "0";
        break;

      case PoolKindCodeEnum.Stake:
        totalVolume = overallStats?.totalStaked?.toString() ?? "0";
        break;

      case PoolKindCodeEnum.Launchpad:
        totalVolume = "123456789"; // TODO: implement API for launchpad pool
        break;

      default:
        void (poolKind satisfies never);
        break;
    }

    return totalVolume;
  }, [overallStats, poolKind]);

  const cards: { title: string; value: string; valueTitle?: string }[] = [
    {
      title: (() => {
        switch (poolKind) {
          case PoolKindCodeEnum.Burn:
            return "Total Burned";
          case PoolKindCodeEnum.Swap:
            return "Total Swap Volume";
          case PoolKindCodeEnum.Stake:
            return "Total Staked";
          case PoolKindCodeEnum.Launchpad:
            return "Total Launchpad Volume";
          default:
            void (poolKind satisfies never);
            return "Total Volume";
        }
      })(),
      value: formatAmount(totalVolume, 0, 2),
      valueTitle: Number(totalVolume).toLocaleString("en-US"),
    },
    {
      title: "Total Transactions",
      value: shortenNumber({
        number: Number(overallStats?.totalTransactions ?? 0),
      }),
      valueTitle: Number(overallStats?.totalTransactions ?? 0).toLocaleString(
        "en-US",
      ),
    },
    {
      title: "Total Pools",
      value: shortenNumber({
        number: Number(overallStats?.totalPools ?? 0),
      }),
      valueTitle: Number(overallStats?.totalPools ?? 0).toLocaleString("en-US"),
    },
    {
      title: "Total Participants",
      value: shortenNumber({
        number: Number(overallStats?.totalParticipants ?? 0),
      }),
      valueTitle: Number(overallStats?.totalParticipants ?? 0).toLocaleString(
        "en-US",
      ),
    },
  ];

  return (
    <div className="global-grid">
      {cards.map((card, index) => (
        <GlowSummaryCard key={index} {...card} variant={variant} />
      ))}
    </div>
  );
};

export default PoolListGlowSummary;
