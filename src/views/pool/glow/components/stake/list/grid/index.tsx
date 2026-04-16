import CopyableText from "@/components/common/copyable-text";
import GridCard from "@/components/common/glow/grid-card";
import GridCardSkeleton from "@/components/common/glow/grid-card-skeleton";
import TokenOutInNetworkDisplay from "@/components/common/glow/token-out-in-network-display";
import MetricNumber from "@/components/common/metric-number";
import NoData from "@/components/common/no-data";
import type { PoolItemType } from "@/types/admin/master-pool-management";
import { truncateString } from "@/utils/helpers/string";
import { renderBurnPoolTime } from "@/views/pool/glow/shared/helpers";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
}

const StakePoolListGrid: React.FC<Props> = ({ data, isLoading }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* <GridCardSkeleton
        count={12}
        isLoading={isLoading}
        classNames={{ container: "gap-y-5 sm:gap-y-10" }}
      /> */}
      {/* <NoData isLoading={isLoading} data={data} /> */}
      {/* TODO: implement stake pool list */}

      {/* TODO: remove demo data */}
      <div className="global-grid gap-y-5 sm:gap-y-10">
        {Array.from({ length: 12 }, (_, i) => (
          <GridCard
            key={i}
            variant="stake"
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
                  tokenOutProps={{}}
                  tokenInProps={{}}
                  networkProps={{
                    networkId: "xphere",
                  }}
                  className="mx-auto"
                />
                <MetricNumber number={123456789} unit={"BTS"} isShorten />
                {/* <p key={tick}>{renderBurnPoolTime(pool)}</p> */}
                <p key={tick}>{"48:25:14"}</p>
              </div>
            }
            btn={{
              asChild: true,
              children: (
                <Link
                  to="/staking/detail/$address"
                  params={{
                    address: "0x1234567890123456789012345678901234567890",
                  }}
                  search={{
                    depositReward: undefined,
                  }}
                >
                  {"Live"}
                </Link>
              ),
            }}
            classNames={{
              content: "space-y-1.5 sm:space-y-3",
            }}
          />
        ))}
      </div>
    </>
  );
};

export default StakePoolListGrid;
