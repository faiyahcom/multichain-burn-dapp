import { PoolKindCodeEnum } from "@/types/pool";
import PoolGlowPageLayout, { PoolGlowSection } from "./shared/layout";
import BurnRecentPoolsTable from "./components/burn/recent-table";
import SwapRecentPoolsTable from "./components/swap/recent-table";
import BurnPoolSection from "./components/burn/pool-section";
import SwapPoolSection from "./components/swap/pool-section";
import {
  useBurnPoolListSearchFilterStore,
  useLaunchpadPoolListSearchFilterStore,
  useStakePoolListSearchFilterStore,
  useSwapPoolListSearchFilterStore,
} from "@/stores/pool-list/search-filter-store";
import StakeRecentPoolsTable from "./components/stake/recent-table";
import StakePoolSection from "./components/stake/pool-section";
import LaunchpadRecentPoolsTable from "./components/launchpad/recent-table";

type Props = {};

const BurnPoolList = ({}: Props) => {
  const { setFilter } = useBurnPoolListSearchFilterStore();

  return (
    <PoolGlowPageLayout
      poolKind={PoolKindCodeEnum.Burn}
      recentSection={
        <PoolGlowSection title="MY BURN LIST" poolKind={PoolKindCodeEnum.Burn}>
          <BurnRecentPoolsTable />
        </PoolGlowSection>
      }
      poolSection={<BurnPoolSection />}
      onTokenClick={(token) => {
        setFilter({
          text: token.customSymbol ?? token.symbol,
        });
      }}
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

const StakePoolList = ({}: Props) => {
  const { setFilter } = useStakePoolListSearchFilterStore();

  return (
    <PoolGlowPageLayout
      poolKind={PoolKindCodeEnum.Stake}
      recentSection={
        <PoolGlowSection
          title="MY STAKING LIST"
          poolKind={PoolKindCodeEnum.Stake}
        >
          <StakeRecentPoolsTable />
        </PoolGlowSection>
      }
      poolSection={<StakePoolSection />}
      onTokenClick={(token) => {
        setFilter({
          text: token.customSymbol ?? token.symbol,
        });
      }}
    />
  );
};

const LaunchpadPoolList = ({}: Props) => {
  const { setFilter } = useLaunchpadPoolListSearchFilterStore();

  return (
    <PoolGlowPageLayout
      poolKind={PoolKindCodeEnum.Launchpad}
      recentSection={
        <PoolGlowSection
          title="MY LAUNCHES"
          poolKind={PoolKindCodeEnum.Launchpad}
        >
          <LaunchpadRecentPoolsTable />
        </PoolGlowSection>
      }
      poolSection={null} // TODO: add pool section
      onTokenClick={(token) => {
        setFilter({
          text: token.customSymbol ?? token.symbol,
        });
      }}
    />
  );
};

export { BurnPoolList, SwapPoolList, StakePoolList, LaunchpadPoolList };
