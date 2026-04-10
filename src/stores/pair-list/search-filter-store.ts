import { NETWORK_CONFIGS } from "@/config/networks";
import type { ListLayout, SortBy, SortOrder } from "@/types/common";
import { create } from "zustand";

type PairListSearchFilterType = {
  page: number;
  text: string;
  network: string[];
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  listLayout?: ListLayout;
};

type PairListSearchFilterState = {
  filter: PairListSearchFilterType;
  setFilter: (filter: Partial<PairListSearchFilterType>) => void;
};

export const usePairListSearchFilterStore = create<PairListSearchFilterState>(
  (set) => ({
    filter: {
      page: 1,
      text: "",
      network: NETWORK_CONFIGS.map((network) => network.id),
      sortBy: "volume",
      sortOrder: "desc",
      listLayout: "card",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }),
);
