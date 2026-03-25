import {
  NETWORK_CONFIGS,
  networkIdToChainId,
  type NetworkId,
} from "@/config/networks";
import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type {
  AdminManagementAdmin,
  AdminManagementRole,
  AdminManagementStatus,
} from "@/types/admin/admin-management";
import { adminManagementRoles } from "@/types/admin/admin-management";
import type { PaginationResponse } from "@/types/common";
import { isEvmAddress, isSolanaAddress } from "@/utils/helpers/address";

const ADMINS_API_ROUTES = API_ROUTES.ADMINS;
const MAX_ADMIN_LIST_LIMIT = 120;

export interface ListAdminManagementRequest {
  page?: number;
  limit?: number;
  search?: string;
  roles?: AdminManagementRole[];
  networkIds?: NetworkId[];
}

export interface ListAdminManagementResponse extends PaginationResponse {
  totalEnable: number;
  totalDisable: number;
  admins: AdminManagementAdmin[];
}

export interface UpsertAdminManagementRequest {
  name: string;
  email: string;
  walletAddress: string;
  role: AdminManagementRole;
  networkId: NetworkId;
  enabled: boolean;
}

export interface UpdateAdminManagementRequest extends UpsertAdminManagementRequest {
  id: string;
}

export interface DeleteAdminManagementRequest {
  walletAddress: string;
  networkId: NetworkId;
}

type AdminManagementApiRole =
  | AdminManagementRole
  | "normal"
  | "superAdmin"
  | "subAdmin";
type AdminManagementApiRoleStatus =
  | AdminManagementStatus
  | "active"
  | "inactive";
type AdminManagementApiStatusValue =
  | AdminManagementApiRoleStatus
  | boolean
  | number
  | null
  | undefined;
type NormalizedAdminApiRole = AdminManagementRole | "normal";

type AdminManagementApiItem = {
  id?: string | number;
  name?: string | null;
  fullName?: string | null;
  fullname?: string | null;
  email?: string | null;
  walletAddress?: string | null;
  wallet_address?: string | null;
  address?: string | null;
  role?: AdminManagementApiRole | null;
  roleStatus?: AdminManagementApiStatusValue;
  role_status?: AdminManagementApiStatusValue;
  roleEnable?: AdminManagementApiStatusValue;
  role_enable?: AdminManagementApiStatusValue;
  enabled?: boolean | null;
  enable?: boolean | null;
  isActive?: boolean | null;
  networkId?: NetworkId | null;
  networkIds?: NetworkId[] | null;
  chainId?: string | number | null;
  chainIds?: Array<string | number> | null;
  createdAt?: string | null;
  created_at?: string | null;
};

type AdminManagementApiListResponse =
  | AdminManagementApiItem[]
  | {
      page?: number;
      total?: number;
      totalEnable?: number;
      totalDisable?: number;
      countEnable?: number;
      countDisable?: number;
      admins?: AdminManagementApiItem[];
      data?: AdminManagementApiItem[];
      items?: AdminManagementApiItem[];
    };

const extractAdminItems = (response: AdminManagementApiListResponse) =>
  Array.isArray(response)
    ? response
    : (response.admins ?? response.data ?? response.items ?? []);

const normalizeAdminRole = (
  role: AdminManagementApiRole | null | undefined,
): NormalizedAdminApiRole => {
  if (role === "super_admin" || role === "superAdmin") {
    return "super_admin";
  }

  if (role === "normal") {
    return "normal";
  }

  return "admin";
};

const normalizeAdminStatus = (
  roleStatus: AdminManagementApiStatusValue,
): AdminManagementStatus | undefined => {
  if (typeof roleStatus === "boolean") {
    return roleStatus ? "enabled" : "disabled";
  }

  if (typeof roleStatus === "number") {
    return roleStatus > 0 ? "enabled" : "disabled";
  }

  if (roleStatus === "enabled" || roleStatus === "active") {
    return "enabled";
  }

  if (roleStatus === "disabled" || roleStatus === "inactive") {
    return "disabled";
  }

  return undefined;
};

const resolveAdminEnabled = (
  item: AdminManagementApiItem,
  normalizedRole: NormalizedAdminApiRole,
) => {
  const normalizedStatus = [
    item.roleEnable,
    item.role_enable,
    item.role_status,
    item.roleStatus,
    item.enabled,
    item.enable,
    item.isActive,
  ]
    .map(normalizeAdminStatus)
    .find((status): status is AdminManagementStatus => status !== undefined);

  if (normalizedStatus !== undefined) {
    return normalizedStatus === "enabled";
  }

  return normalizedRole !== "normal";
};

const toKnownNetworkId = (
  networkId: string | null | undefined,
): NetworkId | undefined => {
  if (!networkId) return undefined;

  return NETWORK_CONFIGS.find((network) => network.id === networkId)?.id;
};

const chainIdToNetworkId = (
  chainId: string | number | null | undefined,
): NetworkId | undefined => {
  if (chainId === null || chainId === undefined) return undefined;

  return NETWORK_CONFIGS.find(
    (network) => network.backendChainId === String(chainId),
  )?.id;
};

const normalizeAdminNetworks = (item: AdminManagementApiItem): NetworkId[] => {
  const networkIds = new Set<NetworkId>();

  const directNetworkId = toKnownNetworkId(item.networkId);
  if (directNetworkId) {
    networkIds.add(directNetworkId);
  }

  item.networkIds?.forEach((networkId) => {
    const normalizedNetworkId = toKnownNetworkId(networkId);
    if (normalizedNetworkId) {
      networkIds.add(normalizedNetworkId);
    }
  });

  const directChainNetworkId = chainIdToNetworkId(item.chainId);
  if (directChainNetworkId) {
    networkIds.add(directChainNetworkId);
  }

  item.chainIds?.forEach((chainId) => {
    const normalizedNetworkId = chainIdToNetworkId(chainId);
    if (normalizedNetworkId) {
      networkIds.add(normalizedNetworkId);
    }
  });

  return [...networkIds];
};

const normalizeAdminItem = (
  item: AdminManagementApiItem,
): { admin: AdminManagementAdmin; apiRole: NormalizedAdminApiRole } => {
  const normalizedRole = normalizeAdminRole(item.role);
  const identity =
    item.walletAddress ??
    item.wallet_address ??
    item.address ??
    item.email ??
    "";
  const scope =
    item.chainId ??
    item.chainIds?.[0] ??
    item.networkId ??
    item.networkIds?.[0] ??
    "global";

  return {
    apiRole: normalizedRole,
    admin: {
      id: String(item.id ?? [scope, identity].filter(Boolean).join(":")),
      name: item.name ?? item.fullName ?? item.fullname ?? "",
      email: item.email ?? "",
      walletAddress:
        item.walletAddress ?? item.wallet_address ?? item.address ?? "",
      role: normalizedRole === "super_admin" ? "super_admin" : "admin",
      enabled: resolveAdminEnabled(item, normalizedRole),
      createdAt: item.createdAt ?? item.created_at ?? "",
      networkIds: normalizeAdminNetworks(item),
    },
  };
};

const matchesAdminSearch = (
  admin: AdminManagementAdmin,
  search: string | undefined,
) => {
  const normalizedSearch = search?.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [admin.name, admin.email, admin.walletAddress].some((value) =>
    value.toLowerCase().includes(normalizedSearch),
  );
};

const compareAdminCreatedAtDesc = (
  left: AdminManagementAdmin,
  right: AdminManagementAdmin,
) => {
  const leftTimestamp = left.createdAt ? new Date(left.createdAt).getTime() : 0;
  const rightTimestamp = right.createdAt
    ? new Date(right.createdAt).getTime()
    : 0;

  return rightTimestamp - leftTimestamp;
};

const fetchAdminsByRole = async (
  role: AdminManagementRole,
): Promise<AdminManagementApiItem[]> => {
  const items: AdminManagementApiItem[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;

  while (items.length < total) {
    const response = await apiClient.get<AdminManagementApiListResponse>(
      ADMINS_API_ROUTES.LIST,
      {
        params: {
          page,
          limit: MAX_ADMIN_LIST_LIMIT,
          role,
        },
      },
    );

    const pageItems = extractAdminItems(response);
    items.push(...pageItems);

    total = Array.isArray(response)
      ? items.length
      : (response.total ?? items.length);

    if (pageItems.length < MAX_ADMIN_LIST_LIMIT) {
      break;
    }

    page += 1;
  }

  return items;
};

const buildUpsertAdminPayload = (request: UpsertAdminManagementRequest) => {
  const chainId = networkIdToChainId(request.networkId);

  if (!chainId) {
    throw new Error("Unsupported network for admin management");
  }

  const fullname = request.name.trim();
  const email = request.email.trim();

  return {
    chainId,
    wallet_address: request.walletAddress.trim(),
    ...(fullname ? { fullname } : {}),
    ...(email ? { email } : {}),
    role: request.role,
    roleEnable: request.enabled,
  };
};

export const adminManagementService = {
  getListAdmins: async (
    params?: ListAdminManagementRequest,
  ): Promise<ListAdminManagementResponse> => {
    const selectedRoles =
      params?.roles === undefined ? [...adminManagementRoles] : params.roles;

    if (selectedRoles.length === 0) {
      return {
        page: params?.page ?? 1,
        total: 0,
        totalEnable: 0,
        totalDisable: 0,
        admins: [],
      };
    }

    const adminsByRole = await Promise.all(
      selectedRoles.map((role) => fetchAdminsByRole(role)),
    );

    const admins = adminsByRole
      .flat()
      .map(normalizeAdminItem)
      .filter(({ apiRole }) =>
        selectedRoles.length
          ? apiRole !== "normal" && selectedRoles.includes(apiRole)
          : apiRole !== "normal",
      )
      .map(({ admin }) => admin)
      .filter((admin) => matchesAdminSearch(admin, params?.search))
      .sort(compareAdminCreatedAtDesc);

    const networkFilteredAdmins =
      params?.networkIds && params.networkIds.length > 0
        ? admins.filter(
            (admin) =>
              admin.networkIds.length === 0 ||
              admin.networkIds.some((networkId) =>
                params.networkIds?.includes(networkId),
              ),
          )
        : admins;
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const paginatedAdmins = networkFilteredAdmins.slice(
      startIndex,
      startIndex + limit,
    );

    return {
      page,
      total: networkFilteredAdmins.length,
      totalEnable: networkFilteredAdmins.filter((admin) => admin.enabled)
        .length,
      totalDisable: networkFilteredAdmins.filter((admin) => !admin.enabled)
        .length,
      admins: paginatedAdmins,
    };
  },

  createAdmin: async (
    request: UpsertAdminManagementRequest,
  ): Promise<AdminManagementAdmin> => {
    const response = await apiClient.post<AdminManagementApiItem>(
      ADMINS_API_ROUTES.UPSERT_USER,
      buildUpsertAdminPayload(request),
    );

    return normalizeAdminItem(response).admin;
  },

  updateAdmin: async (
    request: UpdateAdminManagementRequest,
  ): Promise<AdminManagementAdmin> => {
    const response = await apiClient.post<AdminManagementApiItem>(
      ADMINS_API_ROUTES.UPSERT_USER,
      buildUpsertAdminPayload(request),
    );

    return normalizeAdminItem(response).admin;
  },

  deleteAdmin: async ({
    walletAddress,
    networkId,
  }: DeleteAdminManagementRequest): Promise<void> => {
    const chainId = networkIdToChainId(networkId);

    if (!chainId) {
      throw new Error("Unsupported network for admin management");
    }

    await apiClient.delete(
      ADMINS_API_ROUTES.DELETE(
        chainId,
        encodeURIComponent(walletAddress.trim()),
      ),
    );
  },

  isSupportedWalletAddress: (walletAddress: string) => {
    const trimmedAddress = walletAddress.trim();
    return isEvmAddress(trimmedAddress) || isSolanaAddress(trimmedAddress);
  },
};
