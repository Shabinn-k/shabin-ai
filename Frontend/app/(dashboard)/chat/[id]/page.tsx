'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatInput from '@/components/chat/ChatInput'
import { useChat } from '@/hooks/useChat'
import { useConversations } from '@/hooks/useConversations'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'

export default function ExistingChatPage() {
  const { id } = useParams<{ id: string }>()
  const { messages, setMessages, isLoading, streamingId, sendMessage, stopStreaming } =
    useChat(id)
  const { conversations } = useConversations()
  const [fetchingHistory, setFetchingHistory] = useState(true)

  const title =
    conversations.find((c) => c.id === id)?.title ?? 'Chat'

  useEffect(() => {
    if (!id) return
    setFetchingHistory(true)
    api
      .get(`/api/conversations/${id}/messages`)
      .then(({ data }) => setMessages(data.messages ?? []))
      .catch(() => {})
      .finally(() => setFetchingHistory(false))
  }, [id])

  return (
    <div className="flex flex-col h-full">
      <div className="h-14 border-b border-white/5 flex items-center px-5 bg-surface-900/80 backdrop-blur shrink-0">
        <h1 className="text-sm font-medium text-gray-300 truncate max-w-xs">
          {title}
        </h1>
        <span className="ml-auto text-[11px] text-gray-600 bg-surface-600 border border-white/8 rounded-full px-3 py-1">
          Gemini AI
        </span>
      </div>

      {fetchingHistory ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="w-6 h-6" />
        </div>
      ) : (
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          streamingId={streamingId}
          onStarterClick={(text) => sendMessage(text)}
        />
      )}

      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        isStreaming={isLoading}
      />
    </div>
  )
}
