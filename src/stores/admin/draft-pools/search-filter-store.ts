import { NETWORK_CONFIGS } from "@/config/networks";
import type {
  AllPoolStatus,
  PoolTypeOptionValue,
} from "@/types/admin/master-pool-management";
import { create } from "zustand";

type DraftPoolsSearchFilterType = {
  page: number;
  type?: PoolTypeOptionValue;
  status?: AllPoolStatus[];
  network?: string[];
  text?: string;
};

type MasterPoolManagementSearchFilterState = {
  filter: DraftPoolsSearchFilterType;
  setFilter: (filter: Partial<DraftPoolsSearchFilterType>) => void;
};

export const useDraftPoolsSearchFilterStore =
  create<MasterPoolManagementSearchFilterState>()((set) => ({
    filter: {
      page: 1,
      type: "2", // TODO: Only stake pool, for now
      status: ["draft"], // only show draft pools
      network: NETWORK_CONFIGS.map((network) => network.id),
      text: "",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }));
