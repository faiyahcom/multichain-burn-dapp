export const API_ROUTES = {
  USERS: {
    BASE: "/users",
    REQUEST_SIGNING_MESSAGE: "/users/req-signing-message",
    SIGN_IN_EVM: "/users/evm/sign-in",
    SIGN_IN_SOLANA: "/users/solana/sign-in",
    GET_CURRENT_USER: "/users/me",
  },
  POOLS: {
    LIST: "/pools",
    GET_POOL_DETAIL: (address: string) => `/pools/${address}`,
    GET_POOL_TXNS: (address: string) => `/pools/${address}/txns`,
    GET_POOL_ACTIVITIES: (address: string) => `/pools/${address}/actitvites`,
  },
  WHITELIST: {
    GET_LIST_TOKENS: "/whitelist-tokens",
    CREATE_WHITELIST_TOKEN: "/whitelist-tokens",
    WHITELIST_TOKEN_SUMMARY: "/whitelist-tokens/summary",
    FORCE_UPDATE_WHITELIST_TOKEN_STATUS: (chainId: string, address: string) =>
      `/whitelist-tokens/${chainId}/${address}`,
    DELETE_WHITELIST_TOKEN: (chainId: string, address: string) =>
      `/whitelist-tokens/${chainId}/${address}`,
  },
} as const;
