import { NETWORK_CONFIGS } from "@/config/networks";
import {
  swapPoolStatuses,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";
import type { SortBy, SortOrder } from "@/types/common";
import type { DateRange } from "react-day-picker";
import { create } from "zustand";

export type MasterPoolManagementSwapSearchFilterType = {
  page: number;
  text?: string;
  tokens?: string[];
  status?: SwapPoolStatus[];
  network?: string[];
  dateRange?: DateRange;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
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
    sortBy: "timestamp",
    sortOrder: "desc",
  };

export const isFilterChanged = (
  currentFilter: MasterPoolManagementSwapSearchFilterType,
): boolean => {
  const checks: Record<
    keyof MasterPoolManagementSwapSearchFilterType,
    boolean
  > = {
    page:
      currentFilter.page !== initialMasterPoolManagementSwapSearchFilter.page,
    text:
      currentFilter.text !== initialMasterPoolManagementSwapSearchFilter.text,
    tokens:
      currentFilter.tokens?.length !==
      initialMasterPoolManagementSwapSearchFilter.tokens?.length,
    status:
      currentFilter.status?.length !==
      initialMasterPoolManagementSwapSearchFilter.status?.length,
    network:
      currentFilter.network?.length !==
      initialMasterPoolManagementSwapSearchFilter.network?.length,
    dateRange:
      currentFilter.dateRange?.from !==
        initialMasterPoolManagementSwapSearchFilter.dateRange?.from ||
      currentFilter.dateRange?.to !==
        initialMasterPoolManagementSwapSearchFilter.dateRange?.to,
    sortBy:
      currentFilter.sortBy !==
      initialMasterPoolManagementSwapSearchFilter.sortBy,
    sortOrder:
      currentFilter.sortOrder !==
      initialMasterPoolManagementSwapSearchFilter.sortOrder,
  };
  return Object.values(checks).some(Boolean);
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
