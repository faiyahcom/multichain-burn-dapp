import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthUser = {
  id: string
  address?: string
  chainId?: string
  role?: "normal" | "admin" | "super_admin"
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  error: string | null
  _hasHydrated: boolean
  login: (params: { user: AuthUser; accessToken: string }) => void
  logout: () => void
  setLoading: (value: boolean) => void
  setError: (message: string | null) => void
  setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,
      _hasHydrated: false,
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
      setHasHydrated: (value) =>
        set({ _hasHydrated: value }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
)


