import GlowSummaryCard from "@/components/common/glow/summary-card";
import { poolService } from "@/services/poolService";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { PoolKindCodeEnum, type PoolKindCode } from "@/types/pool";
import { sumTokenAmounts } from "@/utils/shared-functions/calculate";
import { useQuery } from "@tanstack/react-query";
import { getPoolGlowVariant } from "./helpers";
import { shortenNumber } from "@/utils/helpers/numbers";

interface Props {
  poolKind: PoolKindCode;
}

const PoolListGlowSummary = ({ poolKind }: Props) => {
  const { data: overallStats } = useQuery({
    queryKey: poolQueryKeys.stats(poolKind),
    queryFn: () => poolService.getPoolStats(poolKind),
  });
  const variant = getPoolGlowVariant(poolKind);

  const totalVolume = sumTokenAmounts(
    overallStats?.[
      poolKind === PoolKindCodeEnum.Burn ? "totalBurned" : "totalSwapVolume"
    ] ?? [],
    false,
  );

  const cards: { title: string; value: string; valueTitle?: string }[] = [
    {
      title:
        poolKind === PoolKindCodeEnum.Burn ? "Total Burned" : "Total Swapped",
      value: shortenNumber({
        number: Number(totalVolume ?? 0),
      }).toLocaleUpperCase(),
      valueTitle: Number(totalVolume ?? 0).toLocaleString("en-US"),
    },
    {
      title: "Total Transactions",
      value: shortenNumber({
        number: Number(overallStats?.totalTransactions ?? 0),
      }).toLocaleUpperCase(),
      valueTitle: Number(overallStats?.totalTransactions ?? 0).toLocaleString(
        "en-US",
      ),
    },
    {
      title: "Total Pools",
      value: shortenNumber({
        number: Number(overallStats?.totalPools ?? 0),
      }).toLocaleUpperCase(),
      valueTitle: Number(overallStats?.totalPools ?? 0).toLocaleString("en-US"),
    },
    {
      title: "Total Participants",
      value: shortenNumber({
        number: Number(overallStats?.totalParticipants ?? 0),
      }).toLocaleUpperCase(),
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
