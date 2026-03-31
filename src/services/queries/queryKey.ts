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
  all: ["whitelist"] as const,
  listTokensRoot: () => [...whitelistQueryKeys.all, "listTokens"] as const,
  listTokens: (params?: Record<string, unknown>) =>
    [...whitelistQueryKeys.listTokensRoot(), params] as const,
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
  list: (params?: Record<string, unknown>) =>
    ["fee", "list", params] as const,
  stats: (params?: Record<string, unknown>) =>
    ["fee", "stats", params] as const,
};

export const authQueryKeys = {
  me: (params?: Record<string, unknown>) => ["auth", "me", params] as const,
};
