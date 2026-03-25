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
import type { PaginationResponse } from "@/types/common";
import { isEvmAddress, isSolanaAddress } from "@/utils/helpers/address";

const ADMINS_API_ROUTES = API_ROUTES.ADMINS;

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
  roleStatus?: AdminManagementApiRoleStatus | boolean | number | null;
  role_status?: AdminManagementApiRoleStatus | boolean | number | null;
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
  roleStatus: AdminManagementApiItem["role_status"],
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
  const normalizedStatus = normalizeAdminStatus(item.role_status);
  const normalizedRoleStatus = normalizeAdminStatus(item.roleStatus);

  return {
    apiRole: normalizedRole,
    admin: {
      id: String(
        item.id ??
          item.walletAddress ??
          item.wallet_address ??
          item.address ??
          item.email ??
          "",
      ),
      name: item.name ?? item.fullName ?? item.fullname ?? "",
      email: item.email ?? "",
      walletAddress: item.walletAddress ?? item.wallet_address ?? item.address ?? "",
      role: normalizedRole === "super_admin" ? "super_admin" : "admin",
      enabled:
        normalizedStatus !== undefined
          ? normalizedStatus === "enabled"
          : normalizedRoleStatus !== undefined
            ? normalizedRoleStatus === "enabled"
            : (item.enabled ??
              item.enable ??
              item.isActive ??
              normalizedRole !== "normal"),
      createdAt: item.createdAt ?? item.created_at ?? "",
      networkIds: normalizeAdminNetworks(item),
    },
  };
};

const buildUpsertAdminPayload = (request: UpsertAdminManagementRequest) => {
  const chainId = networkIdToChainId(request.networkId);

  if (!chainId) {
    throw new Error("Unsupported network for admin management");
  }

  return {
    chainId: Number(chainId),
    wallet_address: request.walletAddress.trim(),
    fullname: request.name.trim() || null,
    email: request.email.trim(),
    role: request.role,
    role_status: request.enabled,
  };
};

export const adminManagementService = {
  getListAdmins: async (
    params?: ListAdminManagementRequest,
  ): Promise<ListAdminManagementResponse> => {
    const role =
      params?.roles && params.roles.length === 1 ? params.roles[0] : undefined;
    const response = await apiClient.get<AdminManagementApiListResponse>(
      ADMINS_API_ROUTES.LIST,
      {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 20,
          search: params?.search || undefined,
          role,
          networkIds: params?.networkIds?.length ? params.networkIds : undefined,
          chainIds: params?.networkIds?.length
            ? params.networkIds
                .map((networkId) => networkIdToChainId(networkId))
                .filter((chainId): chainId is string => !!chainId)
            : undefined,
        },
        paramsSerializer: { indexes: null },
      },
    );

    const adminsRaw = Array.isArray(response)
      ? response
      : (response.admins ?? response.data ?? response.items ?? []);
    const admins = adminsRaw
      .map(normalizeAdminItem)
      .filter(({ apiRole }) =>
        params?.roles?.length
          ? apiRole !== "normal" && params.roles.includes(apiRole)
          : apiRole !== "normal",
      )
      .map(({ admin }) => admin);
    const filteredAdmins =
      params?.networkIds && params.networkIds.length > 0
        ? admins.filter(
            (admin) =>
              admin.networkIds.length === 0 ||
              admin.networkIds.some((networkId) =>
                params.networkIds?.includes(networkId),
              ),
          )
        : admins;

    return {
      page: Array.isArray(response)
        ? (params?.page ?? 1)
        : (response.page ?? params?.page ?? 1),
      total:
        Array.isArray(response) || (params?.roles && params.roles.length !== 1)
          ? filteredAdmins.length
          : (response.total ?? filteredAdmins.length),
      totalEnable: Array.isArray(response)
        ? filteredAdmins.filter((admin) => admin.enabled).length
        : (response.totalEnable ??
          response.countEnable ??
          filteredAdmins.filter((admin) => admin.enabled).length),
      totalDisable: Array.isArray(response)
        ? filteredAdmins.filter((admin) => !admin.enabled).length
        : (response.totalDisable ??
          response.countDisable ??
          filteredAdmins.filter((admin) => !admin.enabled).length),
      admins: filteredAdmins,
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
      ADMINS_API_ROUTES.DELETE(chainId, walletAddress.trim()),
    );
  },

  isSupportedWalletAddress: (walletAddress: string) => {
    const trimmedAddress = walletAddress.trim();
    return isEvmAddress(trimmedAddress) || isSolanaAddress(trimmedAddress);
  },
};
