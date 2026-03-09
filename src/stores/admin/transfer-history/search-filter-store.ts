import { create } from "zustand";

type AdminTransferHistoryFilterType = {
  tokens: string[];      // token addresses
  network: string;       // single NetworkId or "" for all
  text: string;          // search keyword
  amountMin: string;
  amountMax: string;
  dateFrom: string;      // ISO date string or ""
  dateTo: string;        // ISO date string or ""
  page: number;
};

type AdminTransferHistoryFilterState = {
  filter: AdminTransferHistoryFilterType;
  setFilter: (filter: Partial<AdminTransferHistoryFilterType>) => void;
};

export const useAdminTransferHistoryFilterStore =
  create<AdminTransferHistoryFilterState>((set) => ({
    filter: {
      tokens: [],
      network: "",
      text: "",
      amountMin: "",
      amountMax: "",
      dateFrom: "",
      dateTo: "",
      page: 1,
    },
    setFilter: (partial) =>
      set((state) => ({
        filter: {
          ...state.filter,
          ...partial,
        },
      })),
  }));
