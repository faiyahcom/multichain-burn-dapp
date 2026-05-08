import { NETWORK_CONFIGS } from "@/config/networks";
import {
  userViewBurnPoolStatuses,
  userViewLaunchpadPoolStatuses,
  userViewStakePoolStatuses,
  userViewSwapPoolStatuses,
  type AllPoolStatus,
  type PoolType,
} from "@/types/admin/master-pool-management";
import type { ListLayout, SortBy, SortOrder } from "@/types/common";
import { create } from "zustand";

type PoolListSearchFilterType = {
  page: number;
  text?: string;
  network?: string[];
  status?: AllPoolStatus[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  listLayout?: ListLayout;
};

type PoolListSearchFilterState = {
  filter: PoolListSearchFilterType;
  setFilter: (filter: Partial<PoolListSearchFilterType>) => void;
};

export const useBurnPoolListSearchFilterStore =
  create<PoolListSearchFilterState>()((set) => ({
    filter: {
      page: 1,
      text: "",
      network: NETWORK_CONFIGS.map((network) => network.id),
      status: [...userViewBurnPoolStatuses],
      sortBy: "volume",
      sortOrder: "desc",
      listLayout: "card",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }));

export const useSwapPoolListSearchFilterStore =
  create<PoolListSearchFilterState>()((set) => ({
    filter: {
      page: 1,
      text: "",
      network: NETWORK_CONFIGS.map((network) => network.id),
      status: [...userViewSwapPoolStatuses],
      sortBy: "liquidity",
      sortOrder: "desc",
      listLayout: "card",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }));

export const useStakePoolListSearchFilterStore =
  create<PoolListSearchFilterState>()((set) => ({
    filter: {
      page: 1,
      text: "",
      network: NETWORK_CONFIGS.map((network) => network.id),
      status: [...userViewStakePoolStatuses],
      sortBy: "timestamp",
      sortOrder: "desc",
      listLayout: "card",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }));

export const useLaunchpadPoolListSearchFilterStore =
  create<PoolListSearchFilterState>()((set) => ({
    filter: {
      page: 1,
      text: "",
      network: NETWORK_CONFIGS.map((network) => network.id),
      status: [...userViewLaunchpadPoolStatuses],
      sortBy: "timestamp",
      sortOrder: "desc",
      listLayout: "card",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }));

const store: Record<PoolType, () => PoolListSearchFilterState | undefined> = {
  0: useBurnPoolListSearchFilterStore,
  1: useSwapPoolListSearchFilterStore,
  2: useStakePoolListSearchFilterStore,
  3: useLaunchpadPoolListSearchFilterStore,
} as const;

export const usePoolListSearchFilterStore = (poolType: PoolType) =>
  store[poolType]();
