'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, MessageSquare, Activity, DollarSign, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { useAdminStats, useAdminUsers } from '@/hooks/useAdmin'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import type { User } from '@/types'

export default function AdminPage() {
  const { user: me } = useAuthStore()
  const router = useRouter()

  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { users, isLoading: usersLoading, updateUser } = useAdminUsers()

  useEffect(() => {
    if (me && me.role !== 'admin') {
      toast.error('Admin access required.')
      router.replace('/chat')
    }
  }, [me, router])

  if (me?.role !== 'admin') return null

  const handleToggle = (u: User) => {
    updateUser({ id: u.id, payload: { is_active: !u.is_active } })
    toast.success(`User ${u.is_active ? 'suspended' : 'activated'}.`)
  }

  const handleRoleToggle = (u: User) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    updateUser({ id: u.id, payload: { role: newRole } })
    toast.success(`User role changed to ${newRole}.`)
  }

  const STAT_CARDS = [
    {
      label: 'Total Users',
      value: (stats?.total_users ?? 0).toLocaleString(),
      icon: <Users size={15} />,
    },
    {
      label: 'Active Today',
      value: (stats?.active_today ?? 0).toLocaleString(),
      icon: <Activity size={15} />,
    },
    {
      label: 'Conversations',
      value: (stats?.total_conversations ?? 0).toLocaleString(),
      icon: <MessageSquare size={15} />,
    },
    {
      label: 'Total Cost',
      value: `$${(stats?.total_cost_usd ?? 0).toFixed(4)}`,
      icon: <DollarSign size={15} />,
    },
  ]

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
          <Shield size={18} className="text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Platform overview and user management</p>
        </div>
        <Badge variant="purple" className="ml-auto">
          Admin
        </Badge>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-600 border border-white/8 rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((c) => (
            <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} />
          ))}
        </div>
      )}

      {/* Users table */}
      <div className="bg-surface-600 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">
            Users ({users.length})
          </h2>
          <p className="text-xs text-gray-600">Showing latest 200</p>
        </div>

        {usersLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="w-6 h-6" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-600 border-b border-white/5 uppercase tracking-wider">
                  {['User', 'Provider', 'Role', 'Status', 'Joined', 'Actions'].map(
                    (h) => (
                      <th key={h} className="text-left px-5 py-3 font-medium">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-500/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} src={u.avatar_url} size="xs" />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate max-w-[140px]">
                            {u.name}
                          </p>
                          <p className="text-gray-500 text-xs truncate max-w-[140px]">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-gray-400 text-xs capitalize">
                        {u.provider}
                      </span>
                    </td>
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
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={u.is_active ? 'danger' : 'secondary'}
                          size="sm"
                          onClick={() => handleToggle(u)}
                          disabled={u.id === me?.id}
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRoleToggle(u)}
                          disabled={u.id === me?.id}
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}