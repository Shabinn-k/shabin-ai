'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { User, Cpu, Bell, Shield, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAuth } from '@/hooks/useAuth'

const MODELS = [
  {
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    desc: 'Fastest responses, great for everyday tasks',
    badge: 'Default' as const,
    badgeVariant: 'success' as const,
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    desc: 'Most capable, best for complex reasoning',
    badge: 'Pro' as const,
    badgeVariant: 'purple' as const,
  },
  {
    id: 'gemini-pro',
    label: 'Gemini Pro',
    desc: 'Balanced speed and quality',
    badge: null,
    badgeVariant: 'default' as const,
  },
]

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="text-gray-500">{icon}</div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </p>
    </div>
  )
}

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const { logout } = useAuth()

  const [name, setName] = useState(user?.name ?? '')
  const [saving, setSaving] = useState(false)
  const [model, setModel] = useState('gemini-1.5-flash')
  const [notifications, setNotifications] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const saveProfile = async () => {
    if (!name.trim()) { toast.error('Name cannot be empty.'); return }
    setSaving(true)
    try {
      const { data } = await api.patch('/api/user/me', { name: name.trim() })
      updateUser(data.user)
      toast.success('Profile updated.')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false)
    toast.info('Account deletion requires email confirmation. Feature coming soon.')
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="space-y-5">
        {/* ── Profile ──────────────────────────────────────── */}
        <section className="bg-surface-600 border border-white/8 rounded-2xl p-6">
          <SectionTitle icon={<User size={14} />} title="Profile" />

          <div className="flex items-center gap-4 mb-6 p-3 bg-surface-500 rounded-xl">
            <Avatar
              name={user?.name}
              src={user?.avatar_url}
              size="lg"
              className="glow-purple-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{user?.name}</p>
              <p className="text-gray-400 text-sm truncate">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={user?.role === 'admin' ? 'purple' : 'default'}>
                  {user?.role}
                </Badge>
                <Badge variant={user?.is_active ? 'success' : 'error'}>
                  {user?.is_active ? 'Active' : 'Suspended'}
                </Badge>
                <Badge variant="default">
                  {user?.provider}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
            <Input
              label="Email"
              value={user?.email ?? ''}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
          </div>

          <div className="flex gap-3 mt-5">
            <Button onClick={saveProfile} loading={saving} size="sm">
              Save Changes
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </section>

        {/* ── AI Model ──────────────────────────────────────── */}
        <section className="bg-surface-600 border border-white/8 rounded-2xl p-6">
          <SectionTitle icon={<Cpu size={14} />} title="AI Model" />
          <div className="space-y-1">
            {MODELS.map((m) => (
              <label
                key={m.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all ${
                  model === m.id
                    ? 'bg-brand-600/15 border border-brand-600/30'
                    : 'hover:bg-surface-500 border border-transparent'
                }`}
              >
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  className="accent-brand-500 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{m.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                </div>
                {m.badge && (
                  <Badge variant={m.badgeVariant}>{m.badge}</Badge>
                )}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">
            Model preference is saved locally. The backend uses the model
            configured in your .env file.
          </p>
        </section>

        {/* ── Notifications ─────────────────────────────────── */}
        <section className="bg-surface-600 border border-white/8 rounded-2xl p-6">
          <SectionTitle icon={<Bell size={14} />} title="Notifications" />
          <div className="space-y-4">
            <Toggle
              checked={notifications}
              onChange={setNotifications}
              label="Toast Notifications"
              description="Show success and error notifications within the app"
            />
            <Toggle
              checked={false}
              onChange={() =>
                toast.info('Email notifications coming soon.')
              }
              label="Email Notifications"
              description="Receive weekly usage reports via email"
            />
          </div>
        </section>

        {/* ── Security ──────────────────────────────────────── */}
        <section className="bg-surface-600 border border-white/8 rounded-2xl p-6">
          <SectionTitle icon={<Shield size={14} />} title="Security" />
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <p className="text-sm text-white">Login Method</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  {user?.provider === 'google'
                    ? 'Google OAuth 2.0'
                    : 'Email & Password'}
                </p>
              </div>
              <Badge variant="default" className="capitalize">
                {user?.provider}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-white">Session Tokens</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  JWT access token · 24h expiry
                </p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </section>

        {/* ── Danger Zone ───────────────────────────────────── */}
        <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
          <SectionTitle icon={<Trash2 size={14} />} title="Danger Zone" />
          <p className="text-sm text-gray-400 mb-4">
            Permanently delete your account and all associated data including
            conversations, messages, and saved prompts. This action cannot be
            undone.
          </p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={14} />
            Delete My Account
          </Button>
        </section>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="This will permanently delete your account, all conversations, messages, and saved prompts. Are you absolutely sure?"
        confirmLabel="Yes, Delete Everything"
        variant="danger"
      />
    </div>
  )
}