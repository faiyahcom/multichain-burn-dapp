import GlowSummaryCard from "@/components/common/glow/summary-card";
import { pairService } from "@/services/pairService";
import { pairQueryKeys } from "@/services/queries/queryKey";
import { shortenNumber } from "@/utils/helpers/numbers";
import { useQuery } from "@tanstack/react-query";

const PairListGlowSummary = () => {
  const { data: overallStats } = useQuery({
    queryKey: pairQueryKeys.overallStats(),
    queryFn: pairService.getPairOverallStats,
  });

  const cards: { title: string; value: string; valueTitle?: string }[] = [
    {
      title: "Total Volume",
      value: shortenNumber({
        // number: Number(overallStats?.stats?.totalVolume ?? 0),
        number: 381570000000000, //TODO: map real data here
      }).toLocaleUpperCase(),
      // valueTitle: Number(overallStats?.stats?.totalVolume ?? 0).toLocaleString(
      // 381.57T
      valueTitle: Number(381570000000000).toLocaleString(
        "en-US",
      ),
    },
    {
      title: "Total Participants",
      value: shortenNumber({
        number: Number(overallStats?.stats?.totalParticipants ?? 0),
      }).toLocaleUpperCase(),
      valueTitle: Number(
        overallStats?.stats?.totalParticipants ?? 0,
      ).toLocaleString("en-US"),
    },
    {
      title: "Total Pairs",
      value: shortenNumber({
        number: Number(overallStats?.stats?.totalPairs ?? 0),
      }).toLocaleUpperCase(),
      valueTitle: Number(overallStats?.stats?.totalPairs ?? 0).toLocaleString(
        "en-US",
      ),
    },
    {
      title: "Total Transactions",
      value: shortenNumber({
        number: Number(overallStats?.stats?.totalTransactions ?? 0),
      }).toLocaleUpperCase(),
      valueTitle: Number(
        overallStats?.stats?.totalTransactions ?? 0,
      ).toLocaleString("en-US"),
    },
  ];

  return (
    <div className="global-grid">
      {cards.map((card, index) => (
        <GlowSummaryCard key={index} {...card} variant="pair" />
      ))}
    </div>
  );
};

export default PairListGlowSummary;
