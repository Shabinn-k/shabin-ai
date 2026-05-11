'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Sidebar from '@/components/sidebar/Sidebar'
import { Spinner } from '@/components/ui/Spinner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { token, isHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isHydrated && !token) {
      router.replace('/login')
    }
  }, [token, isHydrated, router])

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!token) return null

  return (
    <div className="flex h-screen bg-surface-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {children}
      </main>
    </div>
  )
}