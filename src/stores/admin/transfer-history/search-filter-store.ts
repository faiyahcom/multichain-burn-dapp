import { NETWORK_CONFIGS } from "@/config/networks";
import { create } from "zustand";

type AdminTransferHistoryFilterType = {
  page: number;
  text: string;
  networkId: string;
  tokens: string[]; // token addresses
  amountOutMin: string;
  amountOutMax: string;
  dateFrom?: Date;
  dateTo?: Date;
};

type AdminTransferHistoryFilterState = {
  filter: AdminTransferHistoryFilterType;
  setFilter: (filter: Partial<AdminTransferHistoryFilterType>) => void;
};

export const useAdminTransferHistoryFilterStore =
  create<AdminTransferHistoryFilterState>((set) => ({
    filter: {
      page: 1,
      text: "",
      networkId: NETWORK_CONFIGS[0]?.id ?? "",
      tokens: [],
      amountOutMin: "",
      amountOutMax: "",
      dateFrom: undefined,
      dateTo: undefined,
    },
    setFilter: (partial) =>
      set((state) => ({
        filter: {
          ...state.filter,
          ...partial,
          page: partial.page ?? 1,
        },
      })),
  }));
