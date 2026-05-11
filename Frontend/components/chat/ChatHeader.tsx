'use client'

import { useState } from 'react'
import { Share2, Download, MoreHorizontal, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Tooltip } from '@/components/ui/Tooltip'
import { truncate } from '@/lib/utils'

interface ChatHeaderProps {
  title?: string
  conversationId?: string
  onRename?: (newTitle: string) => void
}

export default function ChatHeader({
  title = 'New Chat',
  conversationId,
  onRename,
}: ChatHeaderProps) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)

  const handleRename = () => {
    if (editTitle.trim() && editTitle.trim() !== title) {
      onRename?.(editTitle.trim())
      toast.success('Conversation renamed.')
    }
    setEditing(false)
  }

  const handleShare = async () => {
    if (!conversationId) return
    await navigator.clipboard.writeText(
      `${window.location.origin}/chat/${conversationId}`
    )
    toast.success('Chat link copied.')
  }

  return (
    <div className="h-14 border-b border-white/5 flex items-center px-5 bg-surface-900/80 backdrop-blur shrink-0 gap-3">
      {editing ? (
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename()
            if (e.key === 'Escape') {
              setEditTitle(title)
              setEditing(false)
            }
          }}
          autoFocus
          className="flex-1 bg-surface-500 border border-brand-500/50 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
        />
      ) : (
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <h1 className="text-sm font-medium text-gray-300 truncate">
            {truncate(title, 40)}
          </h1>
          {conversationId && (
            <button
              onClick={() => { setEditTitle(title); setEditing(true) }}
              className="text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-[11px] text-gray-600 bg-surface-600 border border-white/8 rounded-full px-3 py-1 hidden sm:block">
          Gemini AI
        </span>
        {conversationId && (
          <Tooltip content="Copy link">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-lg bg-surface-600 border border-white/8 flex items-center justify-center text-gray-500 hover:text-white hover:border-white/15 transition-all"
            >
              <Share2 size={13} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  )
}