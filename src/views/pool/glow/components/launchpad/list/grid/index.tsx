import CopyableText from "@/components/common/copyable-text";
import GridCard from "@/components/common/glow/grid-card";
import GridCardSkeleton from "@/components/common/glow/grid-card-skeleton";
import TokenOutInNetworkDisplay from "@/components/common/glow/token-out-in-network-display";
import MetricNumber from "@/components/common/metric-number";
import NoData from "@/components/common/no-data";
import type { PoolItemType } from "@/types/admin/master-pool-management";
import {
  formatCountdown,
  formatTimestampSecondsToDate,
  truncateString,
} from "@/utils/helpers/string";
import { renderPoolTime } from "@/views/pool/glow/shared/helpers";
import { useEffect, useReducer } from "react";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const LaunchpadPoolListGrid: React.FC<Props> = ({ data, isLoading }) => {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const interval = setInterval(forceUpdate, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <GridCardSkeleton
        count={12}
        isLoading={isLoading}
        classNames={{ container: "gap-y-5 sm:gap-y-10" }}
      />
      {/* <NoData isLoading={isLoading} data={data} /> */}

      {/* TODO: replace with real data */}
      <div className="global-grid gap-y-5 sm:gap-y-10">
        {Array.from({ length: 12 }).map((_, index) => {
          const raised = 35000;
          const goal = 50000;
          const raisedPercent = (raised / goal) * 100;

          const demoFutureTimeStamp = 1778818194;
          const demoPastTimeStamp = 1778386194;
          const demoVariant = index % 2 === 0;
          const demoNowInSeconds = Math.floor(Date.now() / 1000);
          const demoDiff = demoFutureTimeStamp - demoNowInSeconds;

          return (
            <GridCard
              key={index}
              variant="launchpad"
              topSection={
                <div className="relative space-y-1 text-xl sm:space-y-2 sm:text-28px">
                  <p className="max-w-full truncate" title={"YUNA 12"}>
                    {"YUNA 12"}
                  </p>
                  <CopyableText
                    content={"0x1234567890123456789012345678901234567890"}
                    displayText={truncateString({
                      str: "0x1234567890123456789012345678901234567890",
                    })}
                    classNames={{
                      displayText: "font-inter",
                    }}
                  />
                </div>
              }
              bottomSection={
                <div className="relative space-y-1 font-inter text-base sm:space-y-2 sm:text-2xl">
                  <TokenOutInNetworkDisplay
                    tokenOutProps={
                      {
                        //   src: tokenOutDisplay.imageUri,
                        //   alt: tokenOutDisplay.symbol,
                      }
                    }
                    tokenInProps={
                      {
                        //   src: tokenInDisplay.imageUri,
                        //   alt: tokenInDisplay.symbol,
                      }
                    }
                    networkProps={{
                      //   chainId: pool.chainId,
                      networkId: "xphere",
                    }}
                    className="mx-auto"
                  />
                  <p>
                    <span>Raised: </span>
                    <MetricNumber
                      classNames={{ container: "inline-flex w-max" }}
                      number={raised}
                      isShorten
                    />
                    /
                    <MetricNumber
                      classNames={{ container: "inline-flex w-max" }}
                      number={goal}
                      isShorten
                    />{" "}
                    (
                    <MetricNumber
                      classNames={{ container: "inline-flex w-max gap-0" }}
                      number={raisedPercent}
                      unit="%"
                      isShorten
                    />
                    )
                  </p>
                  <p>
                    {/* {renderPoolTime(pool)} */}
                    {demoVariant
                      ? formatCountdown(demoDiff)
                      : formatTimestampSecondsToDate({
                          timestamp: demoPastTimeStamp.toString(),
                        })}
                  </p>
                </div>
              }
              btn={{
                children: demoVariant ? "Live" : "Ended",
              }}
              classNames={{
                content: "space-y-1.5 sm:space-y-3",
                separator: "bg-mb-white-ce",
              }}
            />
          );
        })}
      </div>
    </>
  );
};

export default LaunchpadPoolListGrid;
