import { NETWORK_CONFIGS } from "@/config/networks";
import {
  burnPoolStatuses,
  type AllPoolStatus,
  type PoolTypeOptionValue,
} from "@/types/admin/master-pool-management";
import { create } from "zustand";

type MasterPoolManagementSearchFilterType = {
  page: number;
  type?: PoolTypeOptionValue;
  status?: AllPoolStatus[];
  network?: string[];
  text?: string;
};

type MasterPoolManagementSearchFilterState = {
  filter: MasterPoolManagementSearchFilterType;
  setFilter: (filter: Partial<MasterPoolManagementSearchFilterType>) => void;
};

export const useMasterPoolManagementSearchFilterStore =
  create<MasterPoolManagementSearchFilterState>()((set) => ({
    filter: {
      page: 1,
      type: "all",
      status: [...burnPoolStatuses], // use burn pool statuses because that has all statuses, except "draft"
      network: NETWORK_CONFIGS.map((network) => network.id),
      text: "",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }));
