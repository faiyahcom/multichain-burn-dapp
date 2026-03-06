export const APPKIT_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID;

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL !== undefined
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:8080";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const WSOL_ADDRESS = "So11111111111111111111111111111111111111112";

export const WRONG_NETWORK_ERROR_MESSAGE =
  "Please switch to an account on the correct network to continue.";
