import { NETWORK_CONFIGS } from "@/config/networks";
import {
  userViewBurnPoolStatuses,
  userViewSwapPoolStatuses,
  type BurnPoolStatus,
  type PoolType,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";
import type { SortBy, SortOrder } from "@/types/common";
import { create } from "zustand";

type PoolListSearchFilterType = {
  page: number;
  text?: string;
  network?: string[];
  status?: (BurnPoolStatus | SwapPoolStatus)[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
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
      sortBy: "tvl",
      sortOrder: "desc",
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
      sortBy: "timestamp",
      sortOrder: "desc",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }));

const store: Record<PoolType, () => PoolListSearchFilterState> = {
  0: useBurnPoolListSearchFilterStore,
  1: useSwapPoolListSearchFilterStore,
} as const;

export const usePoolListSearchFilterStore = (poolType: PoolType) =>
  store[poolType]();
