import { NETWORK_CONFIGS } from "@/config/networks";
import type { TokenStatus } from "@/types/admin/whitelist-token";
import { create } from "zustand";

type AdminWhitelistTokenSearchFilterType = {
  status: TokenStatus;
  network: string[];
  text: string;
  page: number;
  decimalMin: string;
  decimalMax: string;
  types: string[]; // pool type values as strings, e.g. ["0", "1", "2", "3"]
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
      decimalMin: "",
      decimalMax: "",
      types: [],
    },
    setFilter: (filter) =>
      set((state) => ({
        filter: {
          ...state.filter,
          ...filter,
          page: filter.page ?? 1,
        },
      })),
  }));
