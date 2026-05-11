import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

export async function logout(): Promise<void> {
  const { refreshToken, clearAuth } = useAuthStore.getState()
  try {
    if (refreshToken) {
      await api.post('/api/auth/logout', { refresh_token: refreshToken })
    }
  } catch {
    // Swallow — always clear local state regardless of server response
  } finally {
    clearAuth()
  }
}

export function getGoogleOAuthURL(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
  return `${base}/api/auth/google`
}
