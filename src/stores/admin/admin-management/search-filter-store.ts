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

const resolveRolesFilter = (
  nextRoles: AdminManagementRole[] | undefined,
  currentRoles: AdminManagementRole[],
) => {
  if (nextRoles === undefined) {
    return currentRoles;
  }

  return nextRoles;
};

const resolveNetworkFilter = (
  nextNetwork: NetworkId[] | undefined,
  currentNetwork: NetworkId[],
) => {
  if (nextNetwork === undefined) {
    return currentNetwork;
  }

  return nextNetwork;
};

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
        const roles = resolveRolesFilter(filter.roles, state.filter.roles);
        const network = resolveNetworkFilter(filter.network, state.filter.network);

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
