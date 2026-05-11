import { NETWORK_CONFIGS } from "@/config/networks";
import type { DateRange } from "react-day-picker";
import { create } from "zustand";

type AdminUserManagementSearchFilterType = {
  page: number;
  limit: number;
  text?: string;
  network?: string[];
  dateRange?: DateRange;
};

type AdminUserManagementSearchFilterState = {
  filter: AdminUserManagementSearchFilterType;
  setFilter: (filter: Partial<AdminUserManagementSearchFilterType>) => void;
};

export const initialAdminUserManagementSearchFilter: AdminUserManagementSearchFilterType =
  {
    page: 1,
    limit: 10,
    text: "",
    network: NETWORK_CONFIGS.map((network) => network.id),
    dateRange: undefined,
  };

export const isFilterChanged = (
  currentFilter: AdminUserManagementSearchFilterType,
): boolean => {
  const checks: Record<keyof AdminUserManagementSearchFilterType, boolean> = {
    page: currentFilter.page !== initialAdminUserManagementSearchFilter.page,
    limit: currentFilter.limit !== initialAdminUserManagementSearchFilter.limit,
    text: currentFilter.text !== initialAdminUserManagementSearchFilter.text,
    network:
      currentFilter.network?.length !==
      initialAdminUserManagementSearchFilter.network?.length,
    dateRange:
      currentFilter.dateRange?.from !==
        initialAdminUserManagementSearchFilter.dateRange?.from ||
      currentFilter.dateRange?.to !==
        initialAdminUserManagementSearchFilter.dateRange?.to,
  };
  return Object.values(checks).some(Boolean);
};

export const useAdminUserManagementSearchFilterStore =
  create<AdminUserManagementSearchFilterState>((set) => ({
    filter: initialAdminUserManagementSearchFilter,
    setFilter: (filter) =>
      set((state) => ({
        filter: {
          ...state.filter,
          ...filter,
          page: filter.page ?? 1,
        },
      })),
  }));
