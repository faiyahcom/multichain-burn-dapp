import { NETWORK_CONFIGS } from "@/config/networks";
import {
  burnPoolStatuses,
  type BurnPoolStatus,
} from "@/types/admin/master-pool-management";
import type { SortBy, SortOrder } from "@/types/common";
import type { DateRange } from "react-day-picker";
import { create } from "zustand";

export const burnPoolTypes = ["all", "partner"] as const;
export type BurnPoolType = (typeof burnPoolTypes)[number];
export const burnPoolTypeLabels: Record<BurnPoolType, string> = {
  all: "All Types",
  partner: "Partner Burn",
};

export type MasterPoolManagementBurnSearchFilterType = {
  page: number;
  text?: string;
  type?: BurnPoolType;
  tokens?: string[];
  status?: BurnPoolStatus[];
  network?: string[];
  poolStartRange?: DateRange;
  poolEndRange?: DateRange;
  dateRange?: DateRange;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
};

type MasterPoolManagementBurnSearchFilterState = {
  filter: MasterPoolManagementBurnSearchFilterType;
  setFilter: (
    filter: Partial<MasterPoolManagementBurnSearchFilterType>,
  ) => void;
};

export const initialMasterPoolManagementBurnSearchFilter: MasterPoolManagementBurnSearchFilterType =
  {
    page: 1,
    text: "",
    type: "all",
    tokens: [],
    status: [...burnPoolStatuses],
    network: NETWORK_CONFIGS.map((network) => network.id),
    poolStartRange: undefined,
    poolEndRange: undefined,
    dateRange: undefined,
    sortBy: "timestamp",
    sortOrder: "desc",
  };

export const isFilterChanged = (
  currentFilter: MasterPoolManagementBurnSearchFilterType,
): boolean => {
  const checks: Record<
    keyof MasterPoolManagementBurnSearchFilterType,
    boolean
  > = {
    page:
      currentFilter.page !== initialMasterPoolManagementBurnSearchFilter.page,
    text:
      currentFilter.text !== initialMasterPoolManagementBurnSearchFilter.text,
    type:
      currentFilter.type !== initialMasterPoolManagementBurnSearchFilter.type,
    tokens:
      currentFilter.tokens?.length !==
      initialMasterPoolManagementBurnSearchFilter.tokens?.length,
    status:
      currentFilter.status?.length !==
      initialMasterPoolManagementBurnSearchFilter.status?.length,
    network:
      currentFilter.network?.length !==
      initialMasterPoolManagementBurnSearchFilter.network?.length,
    poolStartRange:
      currentFilter.poolStartRange?.from !==
        initialMasterPoolManagementBurnSearchFilter.poolStartRange?.from ||
      currentFilter.poolStartRange?.to !==
        initialMasterPoolManagementBurnSearchFilter.poolStartRange?.to,
    poolEndRange:
      currentFilter.poolEndRange?.from !==
        initialMasterPoolManagementBurnSearchFilter.poolEndRange?.from ||
      currentFilter.poolEndRange?.to !==
        initialMasterPoolManagementBurnSearchFilter.poolEndRange?.to,
    dateRange:
      currentFilter.dateRange?.from !==
        initialMasterPoolManagementBurnSearchFilter.dateRange?.from ||
      currentFilter.dateRange?.to !==
        initialMasterPoolManagementBurnSearchFilter.dateRange?.to,
    sortBy:
      currentFilter.sortBy !==
      initialMasterPoolManagementBurnSearchFilter.sortBy,
    sortOrder:
      currentFilter.sortOrder !==
      initialMasterPoolManagementBurnSearchFilter.sortOrder,
  };
  return Object.values(checks).some(Boolean);
};

export const useMasterPoolManagementBurnSearchFilterStore =
  create<MasterPoolManagementBurnSearchFilterState>((set) => ({
    filter: initialMasterPoolManagementBurnSearchFilter,
    setFilter: (filter) =>
      set((state) => ({
        filter: {
          ...state.filter,
          ...filter,
          page: filter.page ?? 1,
        },
      })),
  }));
