import { NETWORK_CONFIGS } from "@/config/networks";
import {
  swapPoolStatuses,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";
import type { DateRange } from "react-day-picker";
import { create } from "zustand";

type MasterPoolManagementSwapSearchFilterType = {
  page: number;
  text?: string;
  tokens?: string[];
  status?: SwapPoolStatus[];
  network?: string[];
  dateRange?: DateRange;
};

type MasterPoolManagementSwapSearchFilterState = {
  filter: MasterPoolManagementSwapSearchFilterType;
  setFilter: (
    filter: Partial<MasterPoolManagementSwapSearchFilterType>,
  ) => void;
};

export const initialMasterPoolManagementSwapSearchFilter: MasterPoolManagementSwapSearchFilterType =
  {
    page: 1,
    text: "",
    tokens: [],
    status: [...swapPoolStatuses],
    network: NETWORK_CONFIGS.map((network) => network.id),
    dateRange: undefined,
  };

export const useMasterPoolManagementSwapSearchFilterStore =
  create<MasterPoolManagementSwapSearchFilterState>((set) => ({
    filter: initialMasterPoolManagementSwapSearchFilter,
    setFilter: (filter) =>
      set((state) => ({
        filter: {
          ...state.filter,
          ...filter,
          page: filter.page ?? 1,
        },
      })),
  }));
