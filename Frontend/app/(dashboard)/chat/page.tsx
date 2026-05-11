'use client'

import { useQueryClient } from '@tanstack/react-query'
import ChatWindow from '@/components/chat/ChatWindow'
import ChatInput from '@/components/chat/ChatInput'
import { useChat } from '@/hooks/useChat'

export default function NewChatPage() {
  const { messages, isLoading, streamingId, sendMessage, stopStreaming } =
    useChat()

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="h-14 border-b border-white/5 flex items-center px-5 bg-surface-900/80 backdrop-blur shrink-0">
        <h1 className="text-sm font-medium text-gray-300">New Chat</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-gray-600 bg-surface-600 border border-white/8 rounded-full px-3 py-1">
            Gemini AI
          </span>
        </div>
      </div>

      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        streamingId={streamingId}
        onStarterClick={(text) => sendMessage(text)}
      />

      <ChatInput
        onSend={sendMessage}
        onStop={stopStreaming}
        disabled={false}
        isStreaming={isLoading}
      />
    </div>
  )
}