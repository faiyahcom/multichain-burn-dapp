import { NETWORK_CONFIGS } from "@/config/networks";
import type { ProfilePoolSearchType } from "@/stores/common/profile-pool";
import { swapPoolStatuses } from "@/types/admin/master-pool-management";
import { create } from "zustand";

type MyParticipatedPoolsLaunchpadSearchFilterState = {
  filter: ProfilePoolSearchType;
  setFilter: (filter: Partial<ProfilePoolSearchType>) => void;
};

export const useMyParticipatedPoolsLaunchpadSearchFilterStore =
  create<MyParticipatedPoolsLaunchpadSearchFilterState>((set) => ({
    filter: {
      page: 1,
      text: "",
      status: [...swapPoolStatuses, "completed"], // user cannot join "upcoming" status, so basically it is the same as swap pool
      network: NETWORK_CONFIGS.map((network) => network.id),
      sortBy: "amountBurned", // TODO: subject to change
      sortOrder: "desc",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }));
