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

type AdminTransferHistoryFilterErrors = {
  amountOutRange?: string;
};

type AdminTransferHistoryFilterState = {
  filter: AdminTransferHistoryFilterType;
  setFilter: (filter: Partial<AdminTransferHistoryFilterType>) => void;
  isValid: boolean;
  errors: AdminTransferHistoryFilterErrors;
};

function validateFilter(
  filter: AdminTransferHistoryFilterType,
): AdminTransferHistoryFilterErrors {
  const errors: AdminTransferHistoryFilterErrors = {};

  const min = parseFloat(filter.amountOutMin);
  const max = parseFloat(filter.amountOutMax);
  if (!isNaN(min) && !isNaN(max) && min > max) {
    errors.amountOutRange = "Min amount cannot be greater than max amount";
  }

  // add more checks here as needed

  return errors;
}

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
    errors: {},
    isValid: true,
    setFilter: (partial) =>
      set((state) => {
        const newFilter = {
          ...state.filter,
          ...partial,
          page: partial.page ?? 1,
        };
        const errors = validateFilter(newFilter);
        return {
          filter: newFilter,
          errors,
          isValid: Object.keys(errors).length === 0,
        };
      }),
  }));
