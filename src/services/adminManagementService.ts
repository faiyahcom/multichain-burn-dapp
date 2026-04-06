import { apiClient } from "@/config/axios";
import {
  NETWORK_CONFIGS,
  chainIdToNetworkConfig,
  networkIdToChainId,
  type NetworkId,
} from "@/config/networks";
import { API_ROUTES } from "@/services/apiRoutes";
import type {
  AdminManagementAdmin,
  AdminManagementRole,
} from "@/types/admin/admin-management";
import type { PaginationResponse } from "@/types/common";
import { isEvmAddress } from "@/utils/helpers/address";

const ADMINS_API_ROUTES = API_ROUTES.ADMINS;
const allAdminManagementNetworkIds = new Set(
  NETWORK_CONFIGS.map((network) => network.id),
);

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

export interface CheckExistingAdminRequest {
  walletAddress: string;
  networkId: NetworkId;
}

type AdminManagementApiRole = AdminManagementRole | "normal";

type AdminManagementApiItem = {
  role: AdminManagementApiRole;
  chainId: bigint | string | number;
  address: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  createdAt: Date | string;
  roleEnable: boolean;
  whitelisted: boolean;
  enable: boolean | null;
  whitelistName: string | null;
  whitelistEmail: string | null;
};

type AdminManagementApiListResponse = {
  page?: number;
  total?: number;
  admins: AdminManagementApiItem[];
};

type FetchAdminManagementPageResponse = ListAdminManagementResponse & {
  rawCount: number;
};


const resolveAdminChainId = (networkId: NetworkId) => {
  const chainId = networkIdToChainId(networkId);

  if (!chainId) {
    throw new Error("Unsupported network for admin management");
  }

  return chainId;
};

const areWalletAddressesEqual = (left?: string, right?: string) => {
  if (!left || !right) {
    return false;
  }

  const normalizedLeft = left.trim();
  const normalizedRight = right.trim();

  if (isEvmAddress(normalizedLeft) && isEvmAddress(normalizedRight)) {
    return normalizedLeft.toLowerCase() === normalizedRight.toLowerCase();
  }

  return normalizedLeft === normalizedRight;
};

const buildAdminChainIdQuery = (networkIds?: NetworkId[]) => {
  if (!networkIds?.length) {
    return undefined;
  }

  const uniqueNetworkIds = [...new Set(networkIds)];

  if (uniqueNetworkIds.length >= allAdminManagementNetworkIds.size) {
    return undefined;
  }

  return uniqueNetworkIds.map(resolveAdminChainId).join(",");
};

const mapAdminApiItem = (
  item: AdminManagementApiItem,
): { admin: AdminManagementAdmin; apiRole: AdminManagementApiRole } => {
  const networkId = chainIdToNetworkConfig(String(item.chainId))?.id;

  return {
    apiRole: item.role,
    admin: {
      id: `${String(item.chainId)}:${item.address}`,
      name: item.name ?? "",
      email: item.email ?? "",
      walletAddress: item.address,
      role: item.role === "super_admin" ? "super_admin" : "admin",
      enabled: item.roleEnable,
      createdAt:
        item.createdAt instanceof Date
          ? item.createdAt.toISOString()
          : item.createdAt,
      networkIds: networkId ? [networkId] : [],
    },
  };
};

const buildUpsertAdminPayload = (request: UpsertAdminManagementRequest) => {
  const fullname = request.name.trim();
  const email = request.email.trim();

  return {
    chainId: resolveAdminChainId(request.networkId),
    wallet_address: request.walletAddress.trim(),
    ...(fullname ? { fullname } : {}),
    ...(email ? { email } : {}),
    role: request.role,
    roleEnable: request.enabled,
  };
};

const getListAdminQueryConfig = (params?: ListAdminManagementRequest) => {
  const selectedRoles = params?.roles;
  const selectedChainId = buildAdminChainIdQuery(params?.networkIds);
  const normalizedSearch = params?.search?.trim();
  const roleQuery =
    selectedRoles && selectedRoles.length > 0
      ? selectedRoles.join(",")
      : undefined;

  return {
    selectedRoles,
    requestParams: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      search: normalizedSearch || undefined,
      role: roleQuery,
      chainId: selectedChainId,
    },
  };
};

const mapAdminListResponse = ({
  response,
  selectedRoles,
  fallbackPage,
}: {
  response: AdminManagementApiListResponse;
  selectedRoles?: AdminManagementRole[];
  fallbackPage?: number;
}): ListAdminManagementResponse => {
  const admins = response.admins
    .map(mapAdminApiItem)
    .filter(
      ({ apiRole }) =>
        apiRole !== "normal" &&
        (!selectedRoles?.length || selectedRoles.includes(apiRole)),
    )
    .map(({ admin }) => admin);

  return {
    page: response.page ?? fallbackPage ?? 1,
    total: response.total ?? admins.length,
    totalEnable: admins.filter((admin) => admin.enabled).length,
    totalDisable: admins.filter((admin) => !admin.enabled).length,
    admins,
  };
};

const fetchAdminManagementPage = async (
  params?: ListAdminManagementRequest,
): Promise<FetchAdminManagementPageResponse> => {
  const { selectedRoles, requestParams } = getListAdminQueryConfig(params);
  const response = await apiClient.get<AdminManagementApiListResponse>(
    ADMINS_API_ROUTES.LIST,
    {
      params: requestParams,
    },
  );

  return {
    ...mapAdminListResponse({
      response,
      selectedRoles,
      fallbackPage: params?.page,
    }),
    rawCount: response.admins.length,
  };
};

export const adminManagementService = {
  getListAdmins: async (
    params?: ListAdminManagementRequest,
  ): Promise<ListAdminManagementResponse> => {
    const response = await fetchAdminManagementPage(params);

    return {
      page: response.page,
      total: response.total,
      totalEnable: response.totalEnable,
      totalDisable: response.totalDisable,
      admins: response.admins,
    };
  },


  checkExistingAdmin: async ({
    walletAddress,
    networkId,
  }: CheckExistingAdminRequest): Promise<boolean> => {
    const normalizedWalletAddress = walletAddress.trim();
    const response = await apiClient.get<AdminManagementApiListResponse>(
      ADMINS_API_ROUTES.LIST,
      {
        params: {
          page: 1,
          limit: 100,
          search: normalizedWalletAddress || undefined,
          chainId: resolveAdminChainId(networkId),
        },
      },
    );

    return response.admins.some((item) => {
      const itemNetworkId = chainIdToNetworkConfig(String(item.chainId))?.id;

      return (
        itemNetworkId === networkId &&
        areWalletAddressesEqual(item.address, normalizedWalletAddress)
      );
    });
  },

  createAdmin: async (
    request: UpsertAdminManagementRequest,
  ): Promise<AdminManagementAdmin> => {
    const response = await apiClient.post<AdminManagementApiItem>(
      ADMINS_API_ROUTES.UPSERT_USER,
      buildUpsertAdminPayload(request),
    );

    return mapAdminApiItem(response).admin;
  },

  updateAdmin: async (
    request: UpdateAdminManagementRequest,
  ): Promise<AdminManagementAdmin> => {
    const response = await apiClient.post<AdminManagementApiItem>(
      ADMINS_API_ROUTES.UPSERT_USER,
      buildUpsertAdminPayload(request),
    );

    return mapAdminApiItem(response).admin;
  },

  deleteAdmin: async ({
    walletAddress,
    networkId,
  }: DeleteAdminManagementRequest): Promise<void> => {
    await apiClient.delete(
      ADMINS_API_ROUTES.DELETE(
        resolveAdminChainId(networkId),
        encodeURIComponent(walletAddress.trim()),
      ),
    );
  },
};
