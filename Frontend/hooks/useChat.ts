import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { genId } from '@/lib/utils'
import { BASE_URL } from '@/lib/api'
import type { Message } from '@/types'

export function useChat(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { token } = useAuthStore()
  const qc = useQueryClient()

  const setMessages_ = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setMessages(updater)
    },
    []
  )

  const sendMessage = useCallback(
    async (content: string, file?: File) => {
      if (!content.trim() && !file) return

      const userMsg: Message = {
        id: genId(),
        role: 'user',
        content: content.trim(),
        conversation_id: conversationId ?? '',
        tokens_used: 0,
        created_at: new Date().toISOString(),
        ...(file ? { file_url: URL.createObjectURL(file) } : {}),
      }

      const aiId = genId()
      const aiMsg: Message = {
        id: aiId,
        role: 'assistant',
        content: '',
        conversation_id: conversationId ?? '',
        tokens_used: 0,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg, aiMsg])
      setIsLoading(true)
      setStreamingId(aiId)

      // Build FormData (required by backend)
      const form = new FormData()
      form.append('message', content.trim())
      if (conversationId) form.append('conversation_id', conversationId)
      if (file) form.append('file', file)

      abortRef.current = new AbortController()

      try {
        const resp = await fetch(`${BASE_URL}/api/chat/stream`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
          signal: abortRef.current.signal,
        })

        if (!resp.ok) {
          throw new Error(`Server error: ${resp.status}`)
        }
        if (!resp.body) throw new Error('No stream body')

        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        let accumulated = ''

        // Read Conversation-ID from header if this was a new chat
        const newConvId = resp.headers.get('X-Conversation-ID')
        if (newConvId && !conversationId) {
          // Refetch sidebar after response completes
          setTimeout(() => qc.invalidateQueries({ queryKey: ['conversations'] }), 500)
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const tok = line.slice(6)
            if (tok === '[DONE]') break
            if (tok.startsWith('⚠️')) {
              // Error token from server
              accumulated = tok
            } else {
              accumulated += tok
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiId ? { ...m, content: accumulated } : m
              )
            )
          }
        }

        // Refresh conversation list
        qc.invalidateQueries({ queryKey: ['conversations'] })
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled
          return
        }
        const errMsg =
          err instanceof Error
            ? `⚠️ ${err.message}`
            : '⚠️ Connection failed. Please try again.'
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId ? { ...m, content: errMsg } : m
          )
        )
      } finally {
        setIsLoading(false)
        setStreamingId(null)
        abortRef.current = null
      }
    },
    [token, conversationId, qc]
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    messages,
    setMessages: setMessages_,
    isLoading,
    streamingId,
    sendMessage,
    stopStreaming,
    clearMessages,
  }
}