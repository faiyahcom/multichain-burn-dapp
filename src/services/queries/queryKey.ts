export const poolQueryKeys = {
  all: ["pools"] as const,
  detail: (address: string) => ["pools", "detail", address] as const,
  txns: (address: string, page?: number) =>
    ["pools", "txns", address, page] as const,
  activities: (address: string, page?: number) =>
    ["pools", "activities", address, page] as const,
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
  list: (params?: Record<string, unknown>) =>
    ["admin-management", "list", params] as const,
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

export const authQueryKeys = {
  me: (params?: Record<string, unknown>) => ["auth", "me", params] as const,
};
