import { PoolKindCodeEnum } from "@/types/pool";
import PoolGlowPageLayout, { PoolGlowSection } from "./shared/layout";
import BurnRecentPoolsTable from "./components/burn/recent-table";
import SwapRecentPoolsTable from "./components/swap/recent-table";
import SwapPoolSection from "./components/swap/pool-section";
import { useSwapPoolListSearchFilterStore } from "@/stores/burn-pool-list/search-filter-store";

type Props = {};

const BurnPoolList = ({}: Props) => {
  return (
    <PoolGlowPageLayout
      poolKind={PoolKindCodeEnum.Burn}
      recentSection={
        <PoolGlowSection title="MY BURN LIST" poolKind={PoolKindCodeEnum.Burn}>
          <BurnRecentPoolsTable />
        </PoolGlowSection>
      }
    />
  );
};

const SwapPoolList = ({}: Props) => {
  const { setFilter } = useSwapPoolListSearchFilterStore();
  
  return (
    <PoolGlowPageLayout
      poolKind={PoolKindCodeEnum.Swap}
      recentSection={
        <PoolGlowSection title="MY SWAP LIST" poolKind={PoolKindCodeEnum.Swap}>
          <SwapRecentPoolsTable />
        </PoolGlowSection>
      }
      poolSection={<SwapPoolSection />}
      onTokenClick={(token) => {
        setFilter({
          text: token.customSymbol ?? token.symbol,
        });
      }}
    />
  );
};

export { BurnPoolList, SwapPoolList };
