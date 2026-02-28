import type { ListLayout, SortBy, SortOrder } from "@/types/common";
import { create } from "zustand";

type PairListSearchFilterType = {
  text: string;
  network: string[];
  sortBy?: Omit<SortBy, "createdAt">;
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
      text: "",
      network: [],
      sortBy: "none",
      sortOrder: "desc",
      listLayout: "list",
    },
    setFilter: (filter) =>
      set((state) => ({ filter: { ...state.filter, ...filter } })),
  }),
);
