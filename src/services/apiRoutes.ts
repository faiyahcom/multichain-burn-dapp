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
  },
} as const;
