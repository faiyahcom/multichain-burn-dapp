import { NETWORK_CONFIGS } from "@/config/networks";
import type { ProfilePoolSearchType } from "@/stores/common/profile-pool";
import { create } from "zustand";

type MyParticipatedPoolsClaimableSearchFilterState = {
  filter: ProfilePoolSearchType;
  setFilter: (filter: Partial<ProfilePoolSearchType>) => void;
};

export const useMyParticipatedPoolsClaimableSearchFilterStore =
  create<MyParticipatedPoolsClaimableSearchFilterState>((set) => ({
    filter: {
      page: 1,
      text: "",
      status: undefined,
      network: NETWORK_CONFIGS.map((network) => network.id),
      sortBy: "claimableReward",
      sortOrder: "desc",
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: { ...state.filter, ...filter, page: filter.page ?? 1 },
      })),
  }));
