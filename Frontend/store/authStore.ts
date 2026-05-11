import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
  isHydrated: boolean
  setAuth: (token: string, refreshToken: string, user: User) => void
  updateUser: (user: User) => void
  clearAuth: () => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isHydrated: false,
      setAuth: (token, refreshToken, user) =>
        set({ token, refreshToken, user }),
      updateUser: (user) => set({ user }),
      clearAuth: () =>
        set({ token: null, refreshToken: null, user: null }),
      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'shabin-auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    }
  )
)