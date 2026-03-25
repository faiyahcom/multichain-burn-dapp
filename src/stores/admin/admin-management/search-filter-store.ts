import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import {
  adminManagementRoles,
  type AdminManagementRole,
} from "@/types/admin/admin-management";
import { create } from "zustand";

type AdminManagementSearchFilterType = {
  roles: AdminManagementRole[];
  network: NetworkId[];
  text: string;
  page: number;
};

type AdminManagementSearchFilterState = {
  filter: AdminManagementSearchFilterType;
  setFilter: (filter: Partial<AdminManagementSearchFilterType>) => void;
};

export const useAdminManagementSearchFilterStore =
  create<AdminManagementSearchFilterState>((set) => ({
    filter: {
      roles: [...adminManagementRoles],
      network: NETWORK_CONFIGS.map((network) => network.id),
      text: "",
      page: 1,
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
