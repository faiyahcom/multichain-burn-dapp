import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  address?: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (params: { user: AuthUser; accessToken: string }) => void;
  logout: () => void;
  setLoading: (value: boolean) => void;
  setError: (message: string | null) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
      login: ({ user, accessToken }) =>
        set({
          user,
          accessToken,
          isLoading: false,
          error: null,
        }),
      logout: () =>
        set({
          user: null,
          accessToken: null,
          isLoading: false,
          error: null,
        }),
      setLoading: (value) =>
        set({
          isLoading: value,
        }),
      setError: (message) =>
        set({
          error: message,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);
