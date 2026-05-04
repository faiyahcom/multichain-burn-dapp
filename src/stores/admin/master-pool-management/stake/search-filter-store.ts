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
