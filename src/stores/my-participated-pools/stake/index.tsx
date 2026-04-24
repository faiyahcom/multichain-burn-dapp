import { NETWORK_CONFIGS } from "@/config/networks";
import type { ProfilePoolSearchType } from "@/stores/common/profile-pool";
import { swapPoolStatuses } from "@/types/admin/master-pool-management";
import { create } from "zustand";

type MyParticipatedPoolsStakeSearchFilterState = {
  filter: ProfilePoolSearchType;
  setFilter: (filter: Partial<ProfilePoolSearchType>) => void;
};

export const useMyParticipatedPoolsStakeSearchFilterStore =
  create<MyParticipatedPoolsStakeSearchFilterState>((set) => ({
    filter: {
      page: 1,
      text: "",
      status: [...swapPoolStatuses],
      network: NETWORK_CONFIGS.map((network) => network.id),
      sortBy: "stakedAmount",
      sortOrder: "desc",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }));
