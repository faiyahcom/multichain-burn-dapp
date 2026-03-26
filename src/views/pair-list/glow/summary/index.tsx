import GlowSummaryCard from "@/components/common/glow/summary-card";
import { pairService } from "@/services/pairService";
import { pairQueryKeys } from "@/services/queries/queryKey";
import { useQuery } from "@tanstack/react-query";

const PairListGlowSummary = () => {
  const { data: overallStats } = useQuery({
    queryKey: pairQueryKeys.overallStats(),
    queryFn: pairService.getPairOverallStats,
  });

  const cards: { title: string; value: string }[] = [
    {
      title: "Total Volume",
      value: Number(overallStats?.stats?.totalVolume ?? 0).toLocaleString(
        "en-US",
      ),
    },
    {
      title: "Total Participants",
      value: Number(overallStats?.stats?.totalParticipants ?? 0).toLocaleString(
        "en-US",
      ),
    },
    {
      title: "Total Pairs",
      value: Number(overallStats?.stats?.totalPairs ?? 0).toLocaleString(
        "en-US",
      ),
    },
    {
      title: "Total Transactions",
      value: Number(overallStats?.stats?.totalTransactions ?? 0).toLocaleString(
        "en-US",
      ),
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
