import { NETWORK_CONFIGS, type NetworkId } from "@/config/networks";
import type {
  AdminManagementAdmin,
  AdminManagementRole,
} from "@/types/admin/admin-management";
import { isEvmAddress, isSolanaAddress } from "@/utils/helpers/address";

const ADMIN_MANAGEMENT_STORAGE_KEY = "admin-management-admins";
const DEFAULT_NETWORK_IDS = NETWORK_CONFIGS.map((network) => network.id);

export interface ListAdminManagementRequest {
  page?: number;
  limit?: number;
  search?: string;
  roles?: AdminManagementRole[];
  networkIds?: NetworkId[];
}

export interface ListAdminManagementResponse {
  total: number;
  totalEnable: number;
  totalDisable: number;
  admins: AdminManagementAdmin[];
}

export interface UpsertAdminManagementRequest {
  name: string;
  email: string;
  walletAddress: string;
  role: AdminManagementRole;
  networkIds?: NetworkId[];
}

export interface UpdateAdminManagementRequest
  extends UpsertAdminManagementRequest {
  id: string;
}

const seedAdmins: AdminManagementAdmin[] = [
  {
    id: "admin-alice-johnson",
    name: "Alice Johnson",
    email: "alice@example.com",
    walletAddress: "0xaD4500000000000000000000000000000000D3e2",
    role: "superAdmin",
    enabled: true,
    networkIds: [...DEFAULT_NETWORK_IDS],
    createdAt: "2025-11-15T00:00:00.000Z",
  },
  {
    id: "admin-bob-williams",
    name: "Bob Williams",
    email: "bob@example.com",
    walletAddress: "0xaD4500000000000000000000000000000000D3e3",
    role: "subAdmin",
    enabled: false,
    networkIds: ["binanceTestnet", "ethereumTestnet"],
    createdAt: "2025-12-01T00:00:00.000Z",
  },
  {
    id: "admin-carol-davis",
    name: "Carol Davis",
    email: "carol@example.com",
    walletAddress: "0xaD4500000000000000000000000000000000D3e4",
    role: "subAdmin",
    enabled: false,
    networkIds: ["ethereumTestnet", "xphereTestnet"],
    createdAt: "2025-12-01T00:00:00.000Z",
  },
  {
    id: "admin-david-brown",
    name: "David Brown",
    email: "david@example.com",
    walletAddress: "0xaD4500000000000000000000000000000000D3e5",
    role: "superAdmin",
    enabled: true,
    networkIds: ["xphereTestnet", "solanaDevnet"],
    createdAt: "2025-12-01T00:00:00.000Z",
  },
  {
    id: "admin-usd-evo-martinez",
    name: "USD Evo Martinez",
    email: "usdevo@example.com",
    walletAddress: "0xaD4500000000000000000000000000000000D3e6",
    role: "subAdmin",
    enabled: true,
    networkIds: ["ethereumTestnet", "binanceTestnet", "xphereTestnet"],
    createdAt: "2025-12-01T00:00:00.000Z",
  },
];

const persistAdmins = (admins: AdminManagementAdmin[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ADMIN_MANAGEMENT_STORAGE_KEY,
    JSON.stringify(admins),
  );
};

const readAdmins = (): AdminManagementAdmin[] => {
  if (typeof window === "undefined") {
    return [...seedAdmins];
  }

  const rawAdmins = window.localStorage.getItem(ADMIN_MANAGEMENT_STORAGE_KEY);
  if (!rawAdmins) {
    persistAdmins(seedAdmins);
    return [...seedAdmins];
  }

  try {
    const parsedAdmins = JSON.parse(rawAdmins) as AdminManagementAdmin[];
    if (!Array.isArray(parsedAdmins) || parsedAdmins.length === 0) {
      persistAdmins(seedAdmins);
      return [...seedAdmins];
    }

    return parsedAdmins;
  } catch {
    persistAdmins(seedAdmins);
    return [...seedAdmins];
  }
};

const normalizeWalletAddress = (walletAddress: string) => {
  const trimmedAddress = walletAddress.trim();

  if (isEvmAddress(trimmedAddress)) {
    return trimmedAddress.toLowerCase();
  }

  return trimmedAddress;
};

const ensureAdminExists = (
  admins: AdminManagementAdmin[],
  id: string,
): AdminManagementAdmin => {
  const targetAdmin = admins.find((admin) => admin.id === id);

  if (!targetAdmin) {
    throw new Error("Admin not found");
  }

  return targetAdmin;
};

export const adminManagementService = {
  getListAdmins: async (
    params?: ListAdminManagementRequest,
  ): Promise<ListAdminManagementResponse> => {
    const admins = readAdmins();
    const trimmedSearch = params?.search?.trim().toLowerCase();

    const filteredAdmins = admins.filter((admin) => {
      const matchesRole =
        !params?.roles?.length || params.roles.includes(admin.role);
      const matchesNetwork =
        !params?.networkIds?.length ||
        admin.networkIds.some((networkId) => params.networkIds?.includes(networkId));
      const matchesSearch =
        !trimmedSearch ||
        [admin.name, admin.email, admin.walletAddress].some((value) =>
          value.toLowerCase().includes(trimmedSearch),
        );

      return matchesRole && matchesNetwork && matchesSearch;
    });

    const page = params?.page ?? 1;
    const limit = params?.limit ?? Math.max(filteredAdmins.length, 1);
    const startIndex = (page - 1) * limit;
    const paginatedAdmins = filteredAdmins.slice(startIndex, startIndex + limit);

    return {
      total: filteredAdmins.length,
      totalEnable: filteredAdmins.filter((admin) => admin.enabled).length,
      totalDisable: filteredAdmins.filter((admin) => !admin.enabled).length,
      admins: paginatedAdmins,
    };
  },

  createAdmin: async (
    request: UpsertAdminManagementRequest,
  ): Promise<AdminManagementAdmin> => {
    const admins = readAdmins();
    const normalizedWalletAddress = normalizeWalletAddress(request.walletAddress);

    const hasDuplicateWallet = admins.some(
      (admin) =>
        normalizeWalletAddress(admin.walletAddress) === normalizedWalletAddress,
    );

    if (hasDuplicateWallet) {
      throw new Error("This wallet address is already assigned to an admin");
    }

    const nextAdmin: AdminManagementAdmin = {
      id: globalThis.crypto.randomUUID(),
      name: request.name.trim(),
      email: request.email.trim(),
      walletAddress: request.walletAddress.trim(),
      role: request.role,
      enabled: true,
      networkIds:
        request.networkIds && request.networkIds.length > 0
          ? request.networkIds
          : [...DEFAULT_NETWORK_IDS],
      createdAt: new Date().toISOString(),
    };

    persistAdmins([nextAdmin, ...admins]);

    return nextAdmin;
  },

  updateAdmin: async (
    request: UpdateAdminManagementRequest,
  ): Promise<AdminManagementAdmin> => {
    const admins = readAdmins();
    const targetAdmin = ensureAdminExists(admins, request.id);
    const normalizedWalletAddress = normalizeWalletAddress(request.walletAddress);

    const hasDuplicateWallet = admins.some(
      (admin) =>
        admin.id !== request.id &&
        normalizeWalletAddress(admin.walletAddress) === normalizedWalletAddress,
    );

    if (hasDuplicateWallet) {
      throw new Error("This wallet address is already assigned to an admin");
    }

    const updatedAdmin: AdminManagementAdmin = {
      ...targetAdmin,
      name: request.name.trim(),
      email: request.email.trim(),
      walletAddress: request.walletAddress.trim(),
      role: request.role,
      networkIds:
        request.networkIds && request.networkIds.length > 0
          ? request.networkIds
          : targetAdmin.networkIds,
    };

    persistAdmins(
      admins.map((admin) => (admin.id === request.id ? updatedAdmin : admin)),
    );

    return updatedAdmin;
  },

  updateAdminStatus: async (
    request: Pick<AdminManagementAdmin, "id" | "enabled">,
  ): Promise<AdminManagementAdmin> => {
    const admins = readAdmins();
    const targetAdmin = ensureAdminExists(admins, request.id);
    const updatedAdmin: AdminManagementAdmin = {
      ...targetAdmin,
      enabled: request.enabled,
    };

    persistAdmins(
      admins.map((admin) => (admin.id === request.id ? updatedAdmin : admin)),
    );

    return updatedAdmin;
  },

  deleteAdmin: async (id: string): Promise<void> => {
    const admins = readAdmins();
    ensureAdminExists(admins, id);
    persistAdmins(admins.filter((admin) => admin.id !== id));
  },

  isSupportedWalletAddress: (walletAddress: string) => {
    const trimmedAddress = walletAddress.trim();
    return isEvmAddress(trimmedAddress) || isSolanaAddress(trimmedAddress);
  },
};
