import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { logout as doLogout } from '@/lib/auth'
import type { AuthResponse } from '@/types'

export function useAuth() {
  const router = useRouter()
  const { token, user, setAuth, clearAuth } = useAuthStore()

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      const { data } = await api.post<AuthResponse>('/api/auth/login', {
        email,
        password,
      })
      setAuth(data.token, data.refresh_token, data.user)
      router.push('/chat')
    },
    [setAuth, router]
  )

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<void> => {
      const { data } = await api.post<AuthResponse>('/api/auth/register', {
        name,
        email,
        password,
      })
      setAuth(data.token, data.refresh_token, data.user)
      router.push('/chat')
    },
    [setAuth, router]
  )

  const logout = useCallback(async () => {
    await doLogout()
    router.push('/login')
  }, [router])

  return { token, user, isAuthenticated: !!token, login, register, logout }
}