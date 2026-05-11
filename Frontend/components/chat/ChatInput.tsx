'use client'

import {
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import {
  Send,
  Paperclip,
  Mic,
  Square,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  onSend: (content: string, file?: File) => void
  onStop?: () => void
  disabled?: boolean
  isStreaming?: boolean
}

const MAX_FILE_MB = 10

export default function ChatInput({
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
}: Props) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSend = (text.trim().length > 0 || file !== null) && !disabled

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    autoResize()
  }

  const handleSend = useCallback(() => {
    if (!canSend) return
    onSend(text, file ?? undefined)
    setText('')
    setFile(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [canSend, onSend, text, file])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File too large. Max size is ${MAX_FILE_MB}MB.`)
      return
    }
    setFile(f)
    e.target.value = ''
  }

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Voice input not supported in your browser.')
      return
    }
    const SR =
      (window as unknown as { SpeechRecognition: typeof SpeechRecognition })
        .SpeechRecognition ||
      (
        window as unknown as {
          webkitSpeechRecognition: typeof SpeechRecognition
        }
      ).webkitSpeechRecognition

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setText((prev) => (prev ? prev + ' ' + transcript : transcript))
      autoResize()
    }
    recognition.onerror = () => {
      setIsListening(false)
      toast.error('Voice recognition failed.')
    }
    recognition.start()
  }

  return (
    <div className="px-4 pb-5 pt-3 border-t border-white/5 bg-surface-900/80 backdrop-blur shrink-0">
      {/* File preview */}
      {file && (
        <div className="mb-2.5 flex items-center gap-2 bg-surface-600 border border-white/10 rounded-lg px-3 py-2 w-fit max-w-xs">
          <span className="text-xs text-gray-300 truncate">📎 {file.name}</span>
          <button
            onClick={() => setFile(null)}
            className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Input box */}
      <div
        className={cn(
          'flex items-end gap-2 bg-surface-600 border rounded-2xl px-4 py-3 transition-colors',
          disabled
            ? 'border-white/5 opacity-60'
            : 'border-white/10 focus-within:border-brand-500/50'
        )}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening ? '🎤 Listening…' : 'Ask Shabin AI anything…'
          }
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent resize-none outline-none text-white placeholder-gray-600 text-sm leading-relaxed max-h-[200px] min-h-[24px]"
        />

        {/* Actions */}
        <div className="flex items-center gap-1.5 pb-0.5 flex-shrink-0">
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.csv,.md,.png,.jpg,.jpeg,.gif,.webp"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            title="Attach file"
            className="w-8 h-8 rounded-lg bg-surface-500 border border-white/8 flex items-center justify-center text-gray-500 hover:text-white hover:border-brand-500/40 transition-all disabled:opacity-40"
          >
            <Paperclip size={15} />
          </button>

          {/* Voice */}
          <button
            type="button"
            onClick={handleVoice}
            disabled={disabled || isListening}
            title="Voice input"
            className={cn(
              'w-8 h-8 rounded-lg bg-surface-500 border border-white/8 flex items-center justify-center transition-all disabled:opacity-40',
              isListening
                ? 'text-red-400 border-red-500/40 animate-pulse'
                : 'text-gray-500 hover:text-white hover:border-brand-500/40'
            )}
          >
            <Mic size={15} />
          </button>

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              title="Stop streaming"
              className="w-9 h-9 rounded-xl bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-all"
            >
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              title="Send message"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-white disabled:opacity-30 hover:opacity-90 hover:scale-105 transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)]"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="text-[10px] text-gray-700 text-center mt-2">
        Shabin AI can make mistakes. Verify important information.
      </p>
    </div>
  )
}