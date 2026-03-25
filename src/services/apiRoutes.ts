export const API_ROUTES = {
  USERS: {
    BASE: "/users",
    REQUEST_SIGNING_MESSAGE: "/users/req-signing-message",
    SIGN_IN_EVM: "/users/evm/sign-in",
    SIGN_IN_SOLANA: "/users/solana/sign-in",
    GET_CURRENT_USER: "/users/me",
    GET_PARTICIPATED_POOLS: "/users/pools",
    GET_POOL_MERKLE_PROOF: (poolAddress: string) =>
      `/users/pools/${poolAddress}/proof`,
    UPDATE_PROFILE: "/users/profile",
  },
  POOLS: {
    LIST: "/pools",
    GET_POOL_DETAIL: (address: string) => `/pools/${address}`,
    GET_POOL_TXNS: (address: string) => `/pools/${address}/txns`,
    GET_POOL_ACTIVITIES: (address: string) => `/pools/${address}/actitvites`,
    REASON_CLOSE_POOL: (address: string) => `/pools/${address}/close-reason`,
  },
  WHITELIST: {
    GET_LIST_TOKENS: "/whitelist-tokens",
    CREATE_WHITELIST_TOKEN: "/whitelist-tokens",
    UPDATE_STATUS_WHITELIST_TOKEN_STATUS: (chainId: string, address: string) =>
      `/whitelist-tokens/${chainId}/${address}`,
    DELETE_WHITELIST_TOKEN: (chainId: string, address: string) =>
      `/whitelist-tokens/${chainId}/${address}`,
  },
  WHITELIST_USERS: {
    GET_LIST_USERS: "/whitelist-users/users",
    UPDATE_USER_INFO: (address: string, chainId: string) => `/whitelist-users/${chainId}/${address}/info`,
    ANALYSIS: "/whitelist-users/analysis",
    HISTORY: "/whitelist-users/history",
  },
  ADMINS: {
    LIST: "/admins",
    UPSERT_USER: "/admins/user",
    DELETE: (chainId: string, address: string) => `/admins/${chainId}/${address}`,
  },
  PAIRS: {
    LIST: "/pairs",
    STATS: (chainId: string) => `/pairs/stats/${chainId}`,
  },
  TRANSFER_HISTORY: {
    LIST: "/transfers",
    ANALYSIS: "/transfers/analysis",
  },
} as const;
