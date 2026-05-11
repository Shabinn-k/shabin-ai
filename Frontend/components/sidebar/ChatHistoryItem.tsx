'use client'

import { useState } from 'react'
import { Trash2, Edit2, Check, X } from 'lucide-react'
import { cn, formatDate, truncate } from '@/lib/utils'
import type { Conversation } from '@/types'

interface Props {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  onDelete: () => void
  onRename: (title: string) => void
}

export default function ChatHistoryItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  onRename,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(conversation.title)

  const submitRename = () => {
    if (title.trim() && title.trim() !== conversation.title) {
      onRename(title.trim())
    } else {
      setTitle(conversation.title)
    }
    setEditing(false)
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !editing && onClick()}
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-all group',
        isActive
          ? 'bg-surface-500 border border-white/8 text-white'
          : 'text-gray-500 hover:bg-surface-600 hover:text-gray-300'
      )}
    >
      {editing ? (
        <>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename()
              if (e.key === 'Escape') {
                setTitle(conversation.title)
                setEditing(false)
              }
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="flex-1 bg-transparent outline-none text-white border-b border-brand-500/50 pb-0.5"
          />
          <button
            onClick={(e) => { e.stopPropagation(); submitRename() }}
            className="text-green-400 hover:text-green-300"
          >
            <Check size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setTitle(conversation.title)
              setEditing(false)
            }}
            className="text-gray-500 hover:text-gray-300"
          >
            <X size={12} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate">{truncate(conversation.title, 28)}</span>
          {hovered && (
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setEditing(true)}
                className="text-gray-600 hover:text-gray-300 transition-colors"
                title="Rename"
              >
                <Edit2 size={11} />
              </button>
              <button
                onClick={onDelete}
                className="text-gray-600 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
