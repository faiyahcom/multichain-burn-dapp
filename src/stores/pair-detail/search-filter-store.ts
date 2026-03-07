import {
  burnPoolStatuses,
  type BurnPoolStatus,
  type PoolType,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";
import type { ListLayout, SortBy, SortOrder } from "@/types/common";
import { create } from "zustand";

type PairDetailSearchFilterType = {
  page: number;
  type?: PoolType;
  status?: (SwapPoolStatus | BurnPoolStatus)[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  text?: string;
  listLayout?: ListLayout;
};

type PairDetailSearchFilterState = {
  filter: PairDetailSearchFilterType;
  setFilter: (filter: Partial<PairDetailSearchFilterType>) => void;
};

export const usePairDetailSearchFilterStore =
  create<PairDetailSearchFilterState>((set) => ({
    filter: {
      page: 1,
      type: 0,
      status: [...burnPoolStatuses],
      sortBy: "volume",
      sortOrder: "desc",
      text: "",
      listLayout: "list",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }));
