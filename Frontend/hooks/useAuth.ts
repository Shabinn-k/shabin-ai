import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { logout as doLogout } from '@/lib/auth'
import type { AuthResponse } from '@/types'
import { toast } from 'sonner'

export function useAuth() {
  const router = useRouter()
  const { token, user, setAuth, clearAuth } = useAuthStore()

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        const { data } = await api.post<AuthResponse>('/api/auth/login', {
          email,
          password,
        })
        
        // Set auth state
        setAuth(data.token, data.refresh_token, data.user)
        
        // Show success message
        toast.success('Login successful!')
        
        // Force a small delay to ensure state is updated
        setTimeout(() => {
          // Use window.location for hard redirect to ensure middleware picks up the cookie
          window.location.href = '/chat'
        }, 100)
      } catch (error: any) {
        console.error('Login error:', error.response?.data || error.message)
        toast.error(error.response?.data?.error || 'Login failed. Please check your credentials.')
        throw error
      }
    },
    [setAuth]
  )

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<void> => {
      try {
        const { data } = await api.post<AuthResponse>('/api/auth/register', {
          name,
          email,
          password,
        })
        
        setAuth(data.token, data.refresh_token, data.user)
        toast.success('Account created successfully!')
        
        setTimeout(() => {
          window.location.href = '/chat'
        }, 100)
      } catch (error: any) {
        console.error('Registration error:', error.response?.data || error.message)
        toast.error(error.response?.data?.error || 'Registration failed. Please try again.')
        throw error
      }
    },
    [setAuth]
  )

  const logout = useCallback(async () => {
    await doLogout()
    window.location.href = '/login'
  }, [])

  return { token, user, isAuthenticated: !!token, login, register, logout }
}