'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { genId } from '@/lib/utils'
import { BASE_URL } from '@/lib/api'
import type { Message } from '@/types'

export function useChat(conversationId?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  // Track the live conversation ID — may differ from the prop when it's a new chat
  const [activeConvId, setActiveConvId] = useState<string | undefined>(
    conversationId
  )

  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const { token } = useAuthStore()
  const qc = useQueryClient()

  // Cleanup on unmount to prevent state updates after unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  // Keep activeConvId in sync with route changes
  useEffect(() => {
    setActiveConvId(conversationId)
  }, [conversationId])

  const setMessages_ = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setMessages(updater)
    },
    []
  )

  const sendMessage = useCallback(
    async (content: string, file?: File) => {
      if (!content.trim() && !file) return
      if (!token) return

      // ── Build user message ──────────────────────────────────────────
      const userMsg: Message = {
        id: genId(),
        role: 'user',
        content: content.trim(),
        conversation_id: activeConvId ?? '',
        tokens_used: 0,
        created_at: new Date().toISOString(),
        ...(file ? { file_url: URL.createObjectURL(file) } : {}),
      }

      // ── Placeholder for AI reply ────────────────────────────────────
      const aiId = genId()
      const aiMsg: Message = {
        id: aiId,
        role: 'assistant',
        content: '',
        conversation_id: activeConvId ?? '',
        tokens_used: 0,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg, aiMsg])
      setIsLoading(true)
      setStreamingId(aiId)

      // ── Build FormData ──────────────────────────────────────────────
      const form = new FormData()
      form.append('message', content.trim())
      if (activeConvId) form.append('conversation_id', activeConvId)
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
          const errText = await resp.text()
          throw new Error(`HTTP ${resp.status}: ${errText}`)
        }

        // ── FIX 2: Capture conversation ID from response header ───────
        const newConvId = resp.headers.get('X-Conversation-ID')
        if (newConvId && mountedRef.current) {
          setActiveConvId(newConvId)
          // Update both messages with the real conversation_id
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsg.id || m.id === aiId
                ? { ...m, conversation_id: newConvId }
                : m
            )
          )
        }

        if (!resp.body) throw new Error('Response has no body')

        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        // FIX 1: carry buffer handles chunks that don't end on \n\n
        let buf = ''
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buf += decoder.decode(value, { stream: true })

          // Process all complete SSE messages (terminated by \n\n)
          const parts = buf.split('\n\n')
          // The last element may be incomplete — keep it in the buffer
          buf = parts.pop() ?? ''

          for (const part of parts) {
            for (const line of part.split('\n')) {
              if (!line.startsWith('data: ')) continue
              const tok = line.slice(6)
              if (tok === '[DONE]') break

              // FIX 5: Error tokens replace content rather than append
              if (tok.startsWith('⚠️')) {
                accumulated = tok
              } else {
                accumulated += tok
              }

              if (mountedRef.current) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiId ? { ...m, content: accumulated } : m
                  )
                )
              }
            }
          }
        }

        // Refresh sidebar conversation list after completion
        if (mountedRef.current) {
          qc.invalidateQueries({ queryKey: ['conversations'] })
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled — leave partial content as-is
          return
        }
        const errMsg =
          err instanceof Error
            ? `⚠️ ${err.message}`
            : '⚠️ Connection failed. Please try again.'

        if (mountedRef.current) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, content: errMsg } : m
            )
          )
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
          setStreamingId(null)
        }
        abortRef.current = null
      }
    },
    [token, activeConvId, qc]
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setActiveConvId(conversationId)
  }, [conversationId])

  return {
    messages,
    setMessages: setMessages_,
    isLoading,
    streamingId,
    activeConvId,
    sendMessage,
    stopStreaming,
    clearMessages,
  }
}