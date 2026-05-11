'use client'

import { useEffect, useRef } from 'react'
import { Sparkles, Zap, Code2, FileText, Calculator } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import type { Message } from '@/types'

const STARTER_PROMPTS = [
  { icon: <Code2 size={16} />, text: 'Write a REST API in Go with Gin framework' },
  { icon: <Sparkles size={16} />, text: 'Explain how neural networks learn' },
  { icon: <FileText size={16} />, text: 'Draft a professional product launch email' },
  { icon: <Calculator size={16} />, text: 'Solve: find all prime numbers up to 1000' },
  { icon: <Zap size={16} />, text: 'Debug this Python code for me' },
  { icon: <Sparkles size={16} />, text: 'Compare React vs Vue vs Svelte in 2025' },
]

interface Props {
  messages: Message[]
  isLoading: boolean
  streamingId: string | null
  onStarterClick?: (text: string) => void
}

export default function ChatWindow({
  messages,
  isLoading,
  streamingId,
  onStarterClick,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto scrollbar-thin">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-2xl mb-5 shadow-[0_0_40px_rgba(124,58,237,0.3)] animate-pulse-slow">
          ✦
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          How can I help you today?
        </h2>
        <p className="text-gray-500 text-sm max-w-md mb-10">
          Powered by Gemini AI. Ask me anything — code, writing, analysis, math, or creative work.
        </p>

        {/* Starter prompts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full">
          {STARTER_PROMPTS.map((p) => (
            <button
              key={p.text}
              onClick={() => onStarterClick?.(p.text)}
              className="flex items-center gap-2.5 px-4 py-3 bg-surface-600 border border-white/5 rounded-xl text-left text-sm text-gray-300 hover:border-brand-500/40 hover:text-white hover:bg-surface-500 transition-all group"
            >
              <span className="text-brand-400 flex-shrink-0 group-hover:text-brand-300 transition-colors">
                {p.icon}
              </span>
              <span className="line-clamp-1">{p.text}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin py-4">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isStreaming={msg.id === streamingId}
        />
      ))}

      {/* Show typing indicator only when loading and last message is from user */}
      {isLoading && messages[messages.length - 1]?.role === 'user' && (
        <TypingIndicator />
      )}

      <div ref={bottomRef} className="h-4" />
    </div>
  )
}