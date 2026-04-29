export const poolQueryKeys = {
  all: ["pools"] as const,
  detail: (address: string) => ["pools", "detail", address] as const,
  txns: (address: string, page?: number, excludeKinds?: string) =>
    ["pools", "txns", address, page, excludeKinds] as const,
  activities: (address: string, page?: number, excludeKinds?: string) =>
    ["pools", "activities", address, page, excludeKinds] as const,
  list: (params?: Record<string, unknown>) =>
    ["pools", "list", params] as const,
};

export const whitelistQueryKeys = {
  listTokens: (params?: Record<string, unknown>) =>
    ["whitelist", "listTokens", params] as const,
};

export const userQueryKeys = {
  participatedPools: (params?: unknown) =>
    ["users", "participatedPools", params] as const,
};

export const whitelistUserQueryKeys = {
  listUsers: (params?: {
    search?: string;
    chainIds?: number[];
    tokenAddresses?: string[];
  }) =>
    [
      "whitelist-users",
      "listUsers",
      params?.search,
      params?.chainIds,
      params?.tokenAddresses,
    ] as const,
  analysis: (params?: Record<string, unknown>) =>
    ["whitelist-users", "analysis", params] as const,
  history: (params?: Record<string, unknown>) =>
    ["whitelist-users", "history", params] as const,
};

export const adminManagementQueryKeys = {
  all: ["admin-management"] as const,
  list: (params?: Record<string, unknown>) =>
    [...adminManagementQueryKeys.all, "list", params] as const,
};

export const pairQueryKeys = {
  list: (params?: Record<string, unknown>) =>
    ["pairs", "list", params] as const,
  stats: (params?: Record<string, unknown>) =>
    ["pairs", "stats", params] as const,
};

export const transferHistoryQueryKeys = {
  list: (params?: Record<string, unknown>) =>
    ["transfer-history", "list", params] as const,
  analysis: () => ["transfer-history", "analysis"] as const,
};

export const feeQueryKeys = {
  list: (params?: Record<string, unknown>) => ["fee", "list", params] as const,
  stats: (params?: Record<string, unknown>) =>
    ["fee", "stats", params] as const,
};

export const authQueryKeys = {
  me: (params?: Record<string, unknown>) => ["auth", "me", params] as const,
};

export const adminNotificationQueryKeys = {
  list: (params?: Record<string, unknown>) =>
    ["admin-notifications", "list", params] as const,
};

export const generalQueryKeys = {
  nativePrices: () => ["general", "native-prices"] as const,
};

export const pairConfigsQueryKeys = {
  list: (params?: Record<string, unknown>) =>
    ["pair-configs", "list", params] as const,
  detail: (params?: Record<string, unknown>) =>
    ["pair-configs", "detail", params] as const,
};

export const adminStatsQueryKeys = {
  stats: ["admin-stats", "stats"] as const,
};

export const adminUserManagementQueryKeys = {
  list: (params?: Record<string, unknown>) =>
    ["admin-user-management", "list", params] as const,
};
