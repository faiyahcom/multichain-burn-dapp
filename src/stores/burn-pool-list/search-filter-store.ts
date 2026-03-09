import { NETWORK_CONFIGS } from "@/config/networks";
import {
  userViewBurnPoolStatuses,
  type BurnPoolStatus,
} from "@/types/admin/master-pool-management";
import type { SortBy, SortOrder } from "@/types/common";
import { create } from "zustand";

type BurnPoolListSearchFilterType = {
  page: number;
  text?: string;
  network?: string[];
  status?: BurnPoolStatus[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
};

type BurnPoolListSearchFilterState = {
  filter: BurnPoolListSearchFilterType;
  setFilter: (filter: Partial<BurnPoolListSearchFilterType>) => void;
};

export const useBurnPoolListSearchFilterStore =
  create<BurnPoolListSearchFilterState>()((set) => ({
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
