import { NETWORK_CONFIGS } from "@/config/networks";
import type { TokenStatus } from "@/types/admin/whitelist-token";
import { create } from "zustand";

type AdminWhitelistTokenSearchFilterType = {
  status: TokenStatus;
  network: string[];
  text: string;
  page: number;
};

type AdminWhitelistTokenSearchFilterState = {
  filter: AdminWhitelistTokenSearchFilterType;
  setFilter: (filter: Partial<AdminWhitelistTokenSearchFilterType>) => void;
};

export const useAdminWhitelistTokenSearchFilterStore =
  create<AdminWhitelistTokenSearchFilterState>((set) => ({
    filter: {
      status: "all",
      network: NETWORK_CONFIGS.map((network) => network.id),
      text: "",
      page: 1,
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: {
          ...state.filter,
          ...filter,
        },
      })),
  }));
