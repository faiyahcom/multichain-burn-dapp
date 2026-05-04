import { NETWORK_CONFIGS } from "@/config/networks";
import {
  burnPoolStatuses,
  type BurnPoolStatus,
} from "@/types/admin/master-pool-management";
import type { DateRange } from "react-day-picker";
import { create } from "zustand";

export const burnPoolTypes = ["all", "partner"] as const;
export type BurnPoolType = (typeof burnPoolTypes)[number];
export const burnPoolTypeLabels: Record<BurnPoolType, string> = {
  all: "All Types",
  partner: "Partner Burn",
};

type MasterPoolManagementBurnSearchFilterType = {
  page: number;
  text?: string;
  type?: BurnPoolType;
  tokens?: string[];
  status?: BurnPoolStatus[];
  network?: string[];
  poolStartRange?: DateRange;
  poolEndRange?: DateRange;
  dateRange?: DateRange;
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
