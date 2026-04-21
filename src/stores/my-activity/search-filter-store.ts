import { myActivityActions, type ActivityKeyList } from "@/types/pool";
import { create } from "zustand";

type MyActivitySearchFilterType = {
  page: number;
  text?: string;
  activityKind?: ActivityKeyList[];
};

type MyActivitySearchFilterState = {
  filter: MyActivitySearchFilterType;
  setFilter: (filter: Partial<MyActivitySearchFilterType>) => void;
};

export const useMyActivitySearchFilterStore =
  create<MyActivitySearchFilterState>((set) => ({
    filter: {
      page: 1,
      text: "",
      activityKind: [...myActivityActions],
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: {
          ...state.filter,
          ...filter,
          page: filter.page ?? 1,
        },
      })),
  }));
