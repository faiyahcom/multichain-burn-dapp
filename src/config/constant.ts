export const APPKIT_PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL !== undefined
    ? import.meta.env.VITE_API_BASE_URL
    : "http://localhost:8080";