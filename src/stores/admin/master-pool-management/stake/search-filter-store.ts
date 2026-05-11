import { NETWORK_CONFIGS } from "@/config/networks";
import {
  stakePoolStatuses,
  type StakePoolStatus,
} from "@/types/admin/master-pool-management";
import { booleanString, type SortBy, type SortOrder } from "@/types/common";
import type { DateRange } from "react-day-picker";
import { create } from "zustand";

export const stakeNotiOptions = [
  "all",
  booleanString[0],
  booleanString[1],
] as const;
export type StakeNotiOption = (typeof stakeNotiOptions)[number];
export const stakeNotiLabels: Record<StakeNotiOption, string> = {
  all: "All Types",
  [booleanString[0]]: "Notification ON",
  [booleanString[1]]: "Notification OFF",
};

export type MasterPoolManagementStakeSearchFilterType = {
  page: number;
  text?: string;
  type?: StakeNotiOption;
  tokens?: string[];
  status?: (StakePoolStatus | "draft")[];
  network?: string[];
  poolStartRange?: DateRange;
  poolEndRange?: DateRange;
  dateRange?: DateRange;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
};

type MasterPoolManagementStakeSearchFilterState = {
  filter: MasterPoolManagementStakeSearchFilterType;
  setFilter: (
    filter: Partial<MasterPoolManagementStakeSearchFilterType>,
  ) => void;
};

export const initialMasterPoolManagementStakeSearchFilter: MasterPoolManagementStakeSearchFilterType =
  {
    page: 1,
    text: "",
    type: "all",
    tokens: [],
    status: ["draft", ...stakePoolStatuses],
    network: NETWORK_CONFIGS.map((network) => network.id),
    poolStartRange: undefined,
    poolEndRange: undefined,
    dateRange: undefined,
    sortBy: "timestamp",
    sortOrder: "desc",
  };

export const isFilterChanged = (
  currentFilter: MasterPoolManagementStakeSearchFilterType,
): boolean => {
  const checks: Record<
    keyof MasterPoolManagementStakeSearchFilterType,
    boolean
  > = {
    page:
      currentFilter.page !== initialMasterPoolManagementStakeSearchFilter.page,
    text:
      currentFilter.text !== initialMasterPoolManagementStakeSearchFilter.text,
    type:
      currentFilter.type !== initialMasterPoolManagementStakeSearchFilter.type,
    tokens:
      currentFilter.tokens?.length !==
      initialMasterPoolManagementStakeSearchFilter.tokens?.length,
    status:
      currentFilter.status?.length !==
      initialMasterPoolManagementStakeSearchFilter.status?.length,
    network:
      currentFilter.network?.length !==
      initialMasterPoolManagementStakeSearchFilter.network?.length,
    poolStartRange:
      currentFilter.poolStartRange?.from !==
        initialMasterPoolManagementStakeSearchFilter.poolStartRange?.from ||
      currentFilter.poolStartRange?.to !==
        initialMasterPoolManagementStakeSearchFilter.poolStartRange?.to,
    poolEndRange:
      currentFilter.poolEndRange?.from !==
        initialMasterPoolManagementStakeSearchFilter.poolEndRange?.from ||
      currentFilter.poolEndRange?.to !==
        initialMasterPoolManagementStakeSearchFilter.poolEndRange?.to,
    dateRange:
      currentFilter.dateRange?.from !==
        initialMasterPoolManagementStakeSearchFilter.dateRange?.from ||
      currentFilter.dateRange?.to !==
        initialMasterPoolManagementStakeSearchFilter.dateRange?.to,
    sortBy:
      currentFilter.sortBy !==
      initialMasterPoolManagementStakeSearchFilter.sortBy,
    sortOrder:
      currentFilter.sortOrder !==
      initialMasterPoolManagementStakeSearchFilter.sortOrder,
  };
  return Object.values(checks).some(Boolean);
};

export const useMasterPoolManagementStakeSearchFilterStore =
  create<MasterPoolManagementStakeSearchFilterState>((set) => ({
    filter: initialMasterPoolManagementStakeSearchFilter,
    setFilter: (filter) =>
      set((state) => ({
        filter: {
          ...state.filter,
          ...filter,
          page: filter.page ?? 1,
        },
      })),
  }));
