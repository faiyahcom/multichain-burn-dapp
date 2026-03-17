import MetricNumber from "@/components/common/metric-number";
import { Skeleton } from "@/components/ui/skeleton";
import { Route } from "@/routes/pair-detail/$chainId/$tokenIn/$tokenOut";
import { pairService } from "@/services/pairService";
import { pairQueryKeys } from "@/services/queries/queryKey";
import { sciToFormatted, shortenNumber } from "@/utils/helpers/numbers";
import { useQuery } from "@tanstack/react-query";

const PairDetailStatistics = () => {
  const { chainId, tokenIn, tokenOut } = Route.useParams();

  const { data: pairDetailStats, isPending: isPairDetailStatsPending } =
    useQuery({
      queryKey: pairQueryKeys.stats({
        chainId,
        tokenIn,
        tokenOut,
      }),
      queryFn: async () => {
        return pairService.getPairStats({
          chainId,
          tokenIn,
          tokenOut,
        });
      },
    });

  const totalPools = pairDetailStats?.totalPools ?? 0;
  const totalParticipants = pairDetailStats?.totalPaticipants ?? 0;

  return (
    <div className="w-68.5">
      <PairDetailStatisticsCard
        isLoading={isPairDetailStatsPending}
        title="Volume"
        value={
          <MetricNumber
            isShorten
            number={sciToFormatted(
              pairDetailStats?.pair.volume ?? "0",
              pairDetailStats?.pair.tokenInDecimals ?? 0,
            )}
            unit={
              pairDetailStats?.pair.tokenInSymbolCustom ??
              pairDetailStats?.pair.tokenInSymbol
            }
            classNames={{
              container: "justify-start",
            }}
          />
        }
      />
      <PairDetailStatisticsCard
        isLoading={isPairDetailStatsPending}
        title="TVL"
        value={
          <MetricNumber
            isShorten
            number={sciToFormatted(
              pairDetailStats?.pair.tvl ?? "0",
              pairDetailStats?.pair.tokenOutDecimals ?? 0,
            )}
            unit={
              pairDetailStats?.pair.tokenOutSymbolCustom ??
              pairDetailStats?.pair.tokenOutSymbol
            }
            classNames={{
              container: "justify-start",
            }}
          />
        }
      />
      <PairDetailStatisticsCard
        isLoading={isPairDetailStatsPending}
        title="Total Pools"
        value={
          <>
            <span
              className="uppercase"
              title={`${totalPools} Pool${totalPools > 1 ? "s" : ""}`}
            >
              {shortenNumber({ number: totalPools })}
            </span>{" "}
            Pool{totalPools > 1 ? "s" : ""}
          </>
        }
      />
      <PairDetailStatisticsCard
        isLoading={isPairDetailStatsPending}
        title="Total Participants"
        value={
          <span
            className="uppercase"
            title={totalParticipants.toLocaleString("en-US")}
          >
            {shortenNumber({ number: totalParticipants })}
          </span>
        }
      />
    </div>
  );
};

interface PairDetailStatisticsCardProps {
  title: string;
  value: React.ReactNode;
  isLoading?: boolean;
}

const PairDetailStatisticsCard: React.FC<PairDetailStatisticsCardProps> = ({
  title,
  value,
  isLoading,
}) => {
  return (
    <div className="space-y-0.75 rounded-md-plus bg-primary-foreground px-7.5 pt-4.75 pb-6.75 odd:mb-4.75 even:mb-7.5">
      <p className="text-15px font-normal">{title}</p>
      {isLoading ? (
        <Skeleton className="h-10 w-full" />
      ) : (
        <div className="text-3xl font-bold text-active">{value}</div>
      )}
    </div>
  );
};

export default PairDetailStatistics;
