'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { User, AdminStats } from '@/types'

export default function AdminPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin') {
      router.replace('/chat')
      return
    }
    Promise.all([
      api.get('/api/admin/stats'),
      api.get('/api/admin/users'),
    ])
      .then(([s, u]) => {
        setStats(s.data.stats)
        setUsers(u.data.users ?? [])
      })
      .catch(() => toast.error('Failed to load admin data.'))
      .finally(() => setLoading(false))
  }, [user])

  const toggleUser = async (u: User) => {
    try {
      await api.patch(`/api/admin/users/${u.id}`, { is_active: !u.is_active })
      setUsers((prev) =>
        prev.map((x) =>
          x.id === u.id ? { ...x, is_active: !x.is_active } : x
        )
      )
      toast.success(`User ${u.is_active ? 'suspended' : 'activated'}.`)
    } catch {
      toast.error('Update failed.')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  const STAT_CARDS = [
    { label: 'Total Users', value: stats?.total_users ?? 0 },
    { label: 'Active Today', value: stats?.active_today ?? 0 },
    { label: 'Conversations', value: stats?.total_conversations ?? 0 },
    { label: 'Messages', value: stats?.total_messages ?? 0 },
  ]

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Platform overview and user management</p>
        </div>
        <Badge variant="purple">Admin</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((c) => (
          <div key={c.label} className="bg-surface-600 border border-white/8 rounded-2xl p-5">
            <p className="text-xs text-gray-500 mb-2">{c.label}</p>
            <p className="text-3xl font-bold text-white">{c.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-surface-600 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-gray-300">
            Users ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-600 border-b border-white/5 uppercase tracking-wider">
                {['Name', 'Email', 'Provider', 'Role', 'Status', 'Actions'].map(
                  (h) => (
                    <th key={h} className="text-left px-5 py-3">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-surface-500/50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-white">{u.name}</td>
                  <td className="px-5 py-3 text-gray-400">{u.email}</td>
                  <td className="px-5 py-3 text-gray-500 capitalize">{u.provider}</td>
                  <td className="px-5 py-3">
                    <Badge variant={u.role === 'admin' ? 'purple' : 'default'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={u.is_active ? 'success' : 'error'}>
                      {u.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Button
                      variant={u.is_active ? 'danger' : 'secondary'}
                      size="sm"
                      onClick={() => toggleUser(u)}
                    >
                      {u.is_active ? 'Suspend' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}