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

// Helper to set cookie for middleware
const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

const removeCookie = (name: string) => {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isHydrated: false,
      setAuth: (token, refreshToken, user) => {
        // Set cookie for middleware
        setCookie('shabin-auth', token, 7)
        set({ token, refreshToken, user })
      },
      updateUser: (user) => set({ user }),
      clearAuth: () => {
        removeCookie('shabin-auth')
        set({ token: null, refreshToken: null, user: null })
      },
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