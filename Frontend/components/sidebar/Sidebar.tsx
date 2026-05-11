'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Plus,
  MessageSquare,
  BookMarked,
  Settings,
  Image as ImageIcon,
  BarChart2,
  Shield,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useAuth } from '@/hooks/useAuth'
import { useConversations } from '@/hooks/useConversations'
import ChatHistoryItem from './ChatHistoryItem'
import { Spinner } from '@/components/ui/Spinner'

const NAV_ITEMS = [
  { label: 'Saved Prompts', path: '/prompts', icon: BookMarked },
  { label: 'Image Gen', path: '/image', icon: ImageIcon },
  { label: 'Usage', path: '/usage', icon: BarChart2 },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { logout } = useAuth()
  const { conversations, isLoading, deleteConversation, renameConversation } =
    useConversations()
  const [search, setSearch] = useState('')
  const [collapsed, setCollapsed] = useState(false)

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleNewChat = () => router.push('/chat')
  const handleNav = (path: string) => router.push(path)

  if (collapsed) {
    return (
      <aside className="w-14 bg-surface-800 border-r border-white/5 flex flex-col items-center py-4 gap-4 flex-shrink-0">
        <button
          onClick={() => setCollapsed(false)}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={handleNewChat}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(124,58,237,0.2)]"
          title="New Chat"
        >
          <Plus size={16} />
        </button>
        <div className="flex-1" />
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            title={item.label}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
              pathname === item.path
                ? 'bg-surface-500 text-white'
                : 'text-gray-500 hover:text-white hover:bg-surface-600'
            )}
          >
            <item.icon size={16} />
          </button>
        ))}
        <button
          onClick={logout}
          title="Logout"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors"
        >
          <LogOut size={15} />
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-60 bg-surface-800 border-r border-white/5 flex flex-col h-full flex-shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-xs shadow-[0_0_12px_rgba(124,58,237,0.3)] flex-shrink-0">
              ✦
            </div>
            <span className="font-bold text-sm">
              Shabin <span className="text-gradient">AI</span>
            </span>
          </div>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-600 hover:text-white transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      </div>

      {/* New Chat */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 bg-gradient-to-r from-brand-600 to-blue-600 text-white rounded-xl px-3 py-2.5 text-sm font-medium hover:opacity-90 transition-all shadow-[0_0_15px_rgba(124,58,237,0.15)]"
        >
          <Plus size={15} />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 bg-surface-600 border border-white/5 rounded-lg px-3 py-1.5">
          <Search size={13} className="text-gray-600 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="flex-1 bg-transparent text-xs text-white placeholder-gray-600 outline-none"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin">
        <p className="text-[10px] text-gray-600 uppercase tracking-wider px-2 py-2">
          Recent
        </p>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner className="w-4 h-4" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-gray-700 text-center py-6 px-2">
            {search ? 'No results found' : 'No conversations yet'}
          </p>
        ) : (
          filtered.map((conv) => (
            <ChatHistoryItem
              key={conv.id}
              conversation={conv}
              isActive={pathname === `/chat/${conv.id}`}
              onClick={() => router.push(`/chat/${conv.id}`)}
              onDelete={() => deleteConversation(conv.id)}
              onRename={(title) =>
                renameConversation({ id: conv.id, title })
              }
            />
          ))
        )}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-white/5 px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all',
              pathname === item.path
                ? 'bg-surface-500 text-white border border-white/8'
                : 'text-gray-500 hover:bg-surface-600 hover:text-gray-300'
            )}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
        {user?.role === 'admin' && (
          <button
            onClick={() => handleNav('/admin')}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all',
              pathname === '/admin'
                ? 'bg-surface-500 text-white border border-white/8'
                : 'text-gray-500 hover:bg-surface-600 hover:text-gray-300'
            )}
          >
            <Shield size={14} />
            Admin
          </button>
        )}
      </div>

      {/* User profile */}
      <div className="border-t border-white/5 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-gray-600 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}