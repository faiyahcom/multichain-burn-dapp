import { NETWORK_CONFIGS } from "@/config/networks";
import { create } from "zustand";

type MinRatioSearchFilterType = {
  page: number;
  text?: string;
  network?: string[];
  min?: string;
  max?: string;
};

type MinRatioSearchFilterState = {
  filter: MinRatioSearchFilterType;
  setFilter: (filter: Partial<MinRatioSearchFilterType>) => void;
};

export const useMinRatioSearchFilterStore = create<MinRatioSearchFilterState>()(
  (set) => ({
    filter: {
      page: 1,
      text: "",
      network: NETWORK_CONFIGS.map((network) => network.id),
      min: "",
      max: "",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }),
);
