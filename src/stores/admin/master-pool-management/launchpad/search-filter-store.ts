import { NETWORK_CONFIGS } from "@/config/networks";
import {
  launchpadModeLabels,
  launchpadModes,
  launchpadPoolStatuses,
  type LaunchpadPoolStatus,
} from "@/types/admin/master-pool-management";
import type { SortBy, SortOrder } from "@/types/common";
import type { DateRange } from "react-day-picker";
import { create } from "zustand";

export const launchpadModeOptions = ["all", ...launchpadModes] as const;
export type LaunchpadModeOption = (typeof launchpadModeOptions)[number];
export const launchpadModeOptionLabels: Record<LaunchpadModeOption, string> = {
  all: "All Modes",
  fixed: launchpadModeLabels.fixed,
  dynamic: launchpadModeLabels.dynamic,
};

export type MasterPoolManagementLaunchpadSearchFilterType = {
  page: number;
  text?: string;
  mode?: LaunchpadModeOption;
  tokens?: string[];
  status?: (LaunchpadPoolStatus | "draft")[];
  network?: string[];
  poolStartRange?: DateRange;
  poolEndRange?: DateRange;
  dateRange?: DateRange;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
};

type MasterPoolManagementLaunchpadSearchFilterState = {
  filter: MasterPoolManagementLaunchpadSearchFilterType;
  setFilter: (
    filter: Partial<MasterPoolManagementLaunchpadSearchFilterType>,
  ) => void;
};

export const initialMasterPoolManagementLaunchpadSearchFilter: MasterPoolManagementLaunchpadSearchFilterType =
  {
    page: 1,
    text: "",
    mode: "all",
    tokens: [],
    status: ["draft", ...launchpadPoolStatuses],
    network: NETWORK_CONFIGS.map((network) => network.id),
    poolStartRange: undefined,
    poolEndRange: undefined,
    dateRange: undefined,
    sortBy: "timestamp",
    sortOrder: "desc",
  };

export const isFilterChanged = (
  currentFilter: MasterPoolManagementLaunchpadSearchFilterType,
): boolean => {
  const checks: Record<
    keyof MasterPoolManagementLaunchpadSearchFilterType,
    boolean
  > = {
    page:
      currentFilter.page !==
      initialMasterPoolManagementLaunchpadSearchFilter.page,
    text:
      currentFilter.text !==
      initialMasterPoolManagementLaunchpadSearchFilter.text,
    mode:
      currentFilter.mode !==
      initialMasterPoolManagementLaunchpadSearchFilter.mode,
    tokens:
      currentFilter.tokens?.length !==
      initialMasterPoolManagementLaunchpadSearchFilter.tokens?.length,
    status:
      currentFilter.status?.length !==
      initialMasterPoolManagementLaunchpadSearchFilter.status?.length,
    network:
      currentFilter.network?.length !==
      initialMasterPoolManagementLaunchpadSearchFilter.network?.length,
    poolStartRange:
      currentFilter.poolStartRange?.from !==
        initialMasterPoolManagementLaunchpadSearchFilter.poolStartRange?.from ||
      currentFilter.poolStartRange?.to !==
        initialMasterPoolManagementLaunchpadSearchFilter.poolStartRange?.to,
    poolEndRange:
      currentFilter.poolEndRange?.from !==
        initialMasterPoolManagementLaunchpadSearchFilter.poolEndRange?.from ||
      currentFilter.poolEndRange?.to !==
        initialMasterPoolManagementLaunchpadSearchFilter.poolEndRange?.to,
    dateRange:
      currentFilter.dateRange?.from !==
        initialMasterPoolManagementLaunchpadSearchFilter.dateRange?.from ||
      currentFilter.dateRange?.to !==
        initialMasterPoolManagementLaunchpadSearchFilter.dateRange?.to,
    sortBy:
      currentFilter.sortBy !==
      initialMasterPoolManagementLaunchpadSearchFilter.sortBy,
    sortOrder:
      currentFilter.sortOrder !==
      initialMasterPoolManagementLaunchpadSearchFilter.sortOrder,
  };
  return Object.values(checks).some(Boolean);
};

export const useMasterPoolManagementLaunchpadSearchFilterStore =
  create<MasterPoolManagementLaunchpadSearchFilterState>((set) => ({
    filter: initialMasterPoolManagementLaunchpadSearchFilter,
    setFilter: (filter) =>
      set((state) => ({
        filter: {
          ...state.filter,
          ...filter,
          page: filter.page ?? 1,
        },
      })),
  }));
