import { myActivityActions, type ActivityKindKey } from "@/types/pool";
import { create } from "zustand";

type MyActivitySearchFilterType = {
  page: number;
  text?: string;
  activityKind?: ActivityKindKey[];
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
      activityKind: Object.keys(myActivityActions).map(
        (key) => Number(key) as ActivityKindKey,
      ),
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
