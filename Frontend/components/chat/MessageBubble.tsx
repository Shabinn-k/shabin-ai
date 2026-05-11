'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message } from '@/types'

interface Props {
  message: Message
  isStreaming?: boolean
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between bg-[#1a1a2e] px-4 py-2 border-b border-white/5">
        <span className="text-xs text-gray-500 font-mono">{language || 'code'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-400 transition-colors"
        >
          {copied ? (
            <>
              <Check size={12} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '16px',
          background: '#0d0d1a',
          fontSize: '12px',
          lineHeight: '1.65',
          borderRadius: 0,
        }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

export default function MessageBubble({ message, isStreaming = false }: Props) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)

  const copyMessage = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 group animate-fade-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
          isUser
            ? 'bg-gradient-to-br from-brand-600 to-blue-600'
            : 'bg-gradient-to-br from-brand-600 to-blue-600 shadow-[0_0_12px_rgba(124,58,237,0.3)]'
        )}
      >
        {isUser ? <User size={14} /> : '✦'}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[85%] min-w-0',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <span className="text-[11px] text-gray-600 px-1">
          {isUser ? 'You' : 'Shabin AI'}
        </span>

        {isUser ? (
          <div className="bg-surface-600 border border-white/8 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-gray-100 leading-relaxed break-words">
            {message.content}
          </div>
        ) : (
          <div className="relative min-w-0 w-full">
            <div className="prose-chat text-sm leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    const lang = match?.[1] ?? ''
                    const code = String(children).replace(/\n$/, '')

                    if (!inline && (lang || code.includes('\n'))) {
                      return <CodeBlock code={code} language={lang} />
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  pre({ children }) {
                    return <>{children}</>
                  },
                  a({ href, children }) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    )
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-brand-400 ml-0.5 animate-pulse align-middle" />
              )}
            </div>

            {/* Copy button — shown on hover */}
            {!isStreaming && message.content && (
              <button
                onClick={copyMessage}
                className="mt-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-300 transition-all"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
        )}

        {/* File attachment */}
        {message.file_url && (
          <a
            href={message.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 mt-1"
          >
            📎 Attached file
          </a>
        )}
      </div>
    </div>
  )
}
