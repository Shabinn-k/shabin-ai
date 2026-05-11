'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const { setAuth } = useAuthStore()

  useEffect(() => {
    const token = params.get('token')
    const refresh = params.get('refresh')
    if (!token || !refresh) {
      router.replace('/login')
      return
    }
    api
      .get('/api/user/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setAuth(token, refresh, data.user)
        router.replace('/chat')
      })
      .catch(() => router.replace('/login'))
  }, [])

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center flex-col gap-4">
      <Spinner className="w-8 h-8" />
      <p className="text-gray-400 text-sm">Completing sign in…</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface-900" />}>
      <CallbackInner />
    </Suspense>
  )
}