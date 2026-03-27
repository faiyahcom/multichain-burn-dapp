import AnimateIconButton from "@/components/common/animate-icon-button";
import CenterSpinner from "@/components/common/center-spinner";
import NoData from "@/components/common/no-data";
import { PoolChainGuard } from "@/components/shared/pool-chain-guard";
import { poolQueryKeys } from "@/services/queries/queryKey";
import { PoolKindCodeEnum } from "@/types/pool";
import type {
  PoolItemType,
  PoolType,
} from "@/types/admin/master-pool-management";
import type { ValueLineInfo } from "@/views/pair-detail/detail/list/card/item";
import PairDetailDetailListCardItem from "@/views/pair-detail/detail/list/card/item";
import SwapDialog from "@/views/swap-pool/swap-action/swap-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface Props {
  data?: PoolItemType[];
  isLoading?: boolean;
  poolType: PoolType;
}

const PoolListGrid: React.FC<Props> = ({ data, isLoading, poolType }) => {
  const isBurnPool = poolType === PoolKindCodeEnum.Burn;
  const queryClient = useQueryClient();
  const [swapPoolAddress, setSwapPoolAddress] = useState<string | undefined>();

  const displayLines: ValueLineInfo[] = isBurnPool
    ? [
        {
          value: "network",
          label: "Network",
        },
        {
          value: "token-in",
          label: "Burn",
        },
        {
          value: "token-out",
          label: "Reward",
        },
        {
          value: "tvl",
          label: "TVL",
        },
      ]
    : [
        {
          value: "ratio",
          label: "Ratio",
        },
        {
          value: "network",
          label: "Network",
        },
        {
          value: "tvl",
          label: "TVL",
        },
      ];

  return (
    <>
      <CenterSpinner isLoading={isLoading} />
      <div className="grid grid-cols-1 gap-x-5.25 gap-y-6 md:grid-cols-2 2xl:grid-cols-3">
        <NoData
          isLoading={isLoading}
          data={data}
          classNames={{
            container: "col-span-1 md:col-span-2 2xl:col-span-3",
          }}
        />
        {data?.map((item) => {
          return (
            <PairDetailDetailListCardItem
              data={item}
              key={item.address}
              displayValues={displayLines}
              swapPoolShowStatusAndRatio={false}
              customActionBtn={
                isBurnPool ? undefined : (
                  <PoolChainGuard
                    chainId={item.chainId}
                    classNames={{
                      btn: "rounded-t-none after:rounded-t-none w-full after:text-primary-foreground border-x-transparent border-b-transparent",
                    }}
                  >
                    <AnimateIconButton
                      variant="letter-icon"
                      textVariant="text-container-center"
                      iconLetter="S"
                      hasGroupHover
                      color="#6E37FF"
                      text="Swap"
                      classNames={{
                        btn: "rounded-t-none after:rounded-t-none w-full after:text-primary-foreground border-x-transparent border-b-transparent",
                      }}
                      btnProps={{
                        onClick: (e) => {
                          e.stopPropagation();
                          setSwapPoolAddress(item.address);
                        },
                      }}
                    />
                  </PoolChainGuard>
                )
              }
              classNames={{
                container: "pt-5",
              }}
            />
          );
        })}
      </div>

      <SwapDialog
        open={!!swapPoolAddress}
        onOpenChange={(open) => {
          if (!open) setSwapPoolAddress(undefined);
        }}
        poolAddress={swapPoolAddress}
        onSuccess={() => {
          setSwapPoolAddress(undefined);
          queryClient.invalidateQueries({
            queryKey: poolQueryKeys.list(),
            exact: false,
          });
        }}
      />
    </>
  );
};

export default PoolListGrid;
