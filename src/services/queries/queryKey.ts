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
  summary: () => ["whitelist", "summary"] as const,
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
};
