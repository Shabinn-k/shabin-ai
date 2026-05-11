'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const MODELS = [
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'Most capable, best for complex tasks' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Fast responses, great for everyday use' },
  { id: 'gemini-pro', label: 'Gemini Pro', desc: 'Balanced performance and speed' },
]

export default function SettingsPage() {
  const { user, token, refreshToken, updateUser } = useAuthStore()
  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [model, setModel] = useState('gemini-1.5-flash')

  const saveProfile = async () => {
    setSaving(true)
    try {
      const { data } = await api.patch('/api/user/me', { name })
      updateUser(data.user)
      toast.success('Profile updated.')
    } catch {
      toast.error('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="space-y-5">
        {/* Profile */}
        <section className="bg-surface-600 border border-white/8 rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">
            Profile
          </p>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-xl font-bold glow-purple-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <p className="font-semibold text-white">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <Badge variant={user?.role === 'admin' ? 'purple' : 'default'} className="mt-1">
                {user?.role}
              </Badge>
            </div>
          </div>
          <Input
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-4"
          />
          <Button onClick={saveProfile} loading={saving} size="sm">
            Save changes
          </Button>
        </section>

        {/* AI Model */}
        <section className="bg-surface-600 border border-white/8 rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">
            AI Model
          </p>
          <div className="space-y-1">
            {MODELS.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-surface-500 transition-colors"
              >
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  className="accent-brand-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
                {m.id === 'gemini-1.5-flash' && (
                  <Badge variant="success">Default</Badge>
                )}
              </label>
            ))}
          </div>
        </section>

        {/* Account */}
        <section className="bg-surface-600 border border-white/8 rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">
            Account
          </p>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <div>
              <p className="text-sm text-white">Login provider</p>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">{user?.provider}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-white">Account status</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {user?.is_active ? 'Active' : 'Suspended'}
              </p>
            </div>
            <Badge variant={user?.is_active ? 'success' : 'error'}>
              {user?.is_active ? 'Active' : 'Suspended'}
            </Badge>
          </div>
        </section>

        {/* Danger zone */}
        <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-4">
            Danger Zone
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <Button variant="danger" size="sm">
            Delete Account
          </Button>
        </section>
      </div>
    </div>
  )
}
