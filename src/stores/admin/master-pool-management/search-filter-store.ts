import {
  burnPoolStatuses,
  type BurnPoolStatus,
  type PoolTypeOptionValue,
  type SwapPoolStatus,
} from "@/types/admin/master-pool-management";
import { create } from "zustand";

type MasterPoolManagementSearchFilterType = {
  type?: PoolTypeOptionValue;
  status?: (SwapPoolStatus | BurnPoolStatus)[];
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
      type: "all",
      status: [...burnPoolStatuses],
      network: [],
      text: "",
    },
    setFilter: (filter) =>
      set((state) => ({ filter: { ...state.filter, ...filter } })),
  }));
