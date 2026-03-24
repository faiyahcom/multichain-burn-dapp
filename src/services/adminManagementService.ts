import { apiClient } from "@/config/axios";
import { API_ROUTES } from "@/services/apiRoutes";
import type {
  AdminManagementAdmin,
  AdminManagementRole,
} from "@/types/admin/admin-management";
import type { PaginationResponse } from "@/types/common";
import { isEvmAddress, isSolanaAddress } from "@/utils/helpers/address";

const ADMINS_API_ROUTES = API_ROUTES.ADMINS;

export interface ListAdminManagementRequest {
  page?: number;
  limit?: number;
  search?: string;
  roles?: AdminManagementRole[];
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
}

export interface UpdateAdminManagementRequest extends UpsertAdminManagementRequest {
  id: string;
}

type AdminManagementApiRole = AdminManagementRole | "superAdmin" | "subAdmin";

type AdminManagementApiItem = {
  id?: string | number;
  name?: string | null;
  fullName?: string | null;
  email?: string | null;
  walletAddress?: string | null;
  address?: string | null;
  role?: AdminManagementApiRole | null;
  enabled?: boolean | null;
  enable?: boolean | null;
  isActive?: boolean | null;
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
): AdminManagementRole => {
  if (role === "super_admin" || role === "superAdmin") {
    return "super_admin";
  }

  return "admin";
};

const normalizeAdminItem = (
  item: AdminManagementApiItem,
): AdminManagementAdmin => ({
  id: String(item.id ?? item.walletAddress ?? item.address ?? item.email ?? ""),
  name: item.name ?? item.fullName ?? "",
  email: item.email ?? "",
  walletAddress: item.walletAddress ?? item.address ?? "",
  role: normalizeAdminRole(item.role),
  enabled: item.enabled ?? item.enable ?? item.isActive ?? true,
  createdAt: item.createdAt ?? item.created_at ?? "",
});

const getUnsupportedMutationError = () =>
  new Error(
    "Admin management write APIs are not available in backend yet. Current OpenAPI only exposes GET /admins/.",
  );

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
        },
      },
    );

    const adminsRaw = Array.isArray(response)
      ? response
      : (response.admins ?? response.data ?? response.items ?? []);
    const admins = adminsRaw.map(normalizeAdminItem);

    return {
      page: Array.isArray(response)
        ? (params?.page ?? 1)
        : (response.page ?? params?.page ?? 1),
      total: Array.isArray(response)
        ? admins.length
        : (response.total ?? admins.length),
      totalEnable: Array.isArray(response)
        ? admins.filter((admin) => admin.enabled).length
        : (response.totalEnable ??
          response.countEnable ??
          admins.filter((admin) => admin.enabled).length),
      totalDisable: Array.isArray(response)
        ? admins.filter((admin) => !admin.enabled).length
        : (response.totalDisable ??
          response.countDisable ??
          admins.filter((admin) => !admin.enabled).length),
      admins,
    };
  },

  createAdmin: async (
    request: UpsertAdminManagementRequest,
  ): Promise<AdminManagementAdmin> => {
    void request;
    // TODO: wire POST /admins once backend exposes a write endpoint.
    throw getUnsupportedMutationError();
  },

  updateAdmin: async (
    request: UpdateAdminManagementRequest,
  ): Promise<AdminManagementAdmin> => {
    void request;
    // TODO: wire PATCH /admins/:id once backend exposes a write endpoint.
    throw getUnsupportedMutationError();
  },

  updateAdminStatus: async (
    request: Pick<AdminManagementAdmin, "id" | "enabled">,
  ): Promise<AdminManagementAdmin> => {
    void request;
    // TODO: wire a dedicated status toggle endpoint once backend exposes it.
    throw getUnsupportedMutationError();
  },

  deleteAdmin: async (id: string): Promise<void> => {
    void id;
    // TODO: wire DELETE /admins/:id once backend exposes a write endpoint.
    throw getUnsupportedMutationError();
  },

  isSupportedWalletAddress: (walletAddress: string) => {
    const trimmedAddress = walletAddress.trim();
    return isEvmAddress(trimmedAddress) || isSolanaAddress(trimmedAddress);
  },
};
