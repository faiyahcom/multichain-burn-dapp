import {
  stakePoolStatuses,
  type StakePoolStatus,
} from "@/types/admin/master-pool-management";
import { booleanString } from "@/types/common";
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

type MasterPoolManagementStakeSearchFilterType = {
  page: number;
  text?: string;
  type?: StakeNotiOption;
  tokens?: string[];
  status?: (StakePoolStatus | "draft")[];
  network?: string[];
  poolStartRange?: DateRange;
  poolEndRange?: DateRange;
  dateRange?: DateRange;
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
    network: [],
    poolStartRange: undefined,
    poolEndRange: undefined,
    dateRange: undefined,
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
