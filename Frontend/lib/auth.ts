import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

export async function logout() {
  const { refreshToken, clearAuth } = useAuthStore.getState()
  try {
    if (refreshToken) {
      await api.post('/api/auth/logout', { refresh_token: refreshToken })
    }
  } finally {
    clearAuth()
  }
}

export function getGoogleOAuthURL(): string {
  return `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`
}
