import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import {
  adminManagementRoles,
  type AdminManagementRole,
} from "@/types/admin/admin-management";
import { create } from "zustand";

const allAdminManagementRoles = [...adminManagementRoles];
const allAdminManagementNetworkIds = NETWORK_CONFIGS.map(
  (network) => network.id,
);

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
      roles: allAdminManagementRoles,
      network: allAdminManagementNetworkIds,
      text: "",
      page: 1,
    },
    setFilter: (filter) =>
      set((state) => {
        const roles =
          filter.roles === undefined
            ? state.filter.roles
            : filter.roles.length > 0
              ? filter.roles
              : allAdminManagementRoles;
        const network =
          filter.network === undefined
            ? state.filter.network
            : filter.network.length > 0
              ? filter.network
              : allAdminManagementNetworkIds;

        return {
          filter: {
            ...state.filter,
            ...filter,
            roles,
            network,
            page: filter.page ?? 1,
          },
        };
      }),
  }));
