'use client'

import { useState } from 'react'
import { Plus, BookMarked, Trash2, Clipboard, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { usePrompts } from '@/hooks/usePrompts'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import type { SavedPrompt } from '@/types'

const CATEGORY_COLORS: Record<string, 'purple' | 'success' | 'warning' | 'default'> = {
  Development: 'purple',
  Writing: 'success',
  Analysis: 'warning',
  Marketing: 'default',
  Education: 'success',
  Business: 'warning',
}

const QUICK_TEMPLATES = [
  {
    title: 'Code Reviewer',
    content: 'Review the following code for bugs, performance issues, security vulnerabilities, and best practices. Explain each issue found:\n\n',
    category: 'Development',
  },
  {
    title: 'Step-by-Step Explainer',
    content: 'Explain the following concept step by step, using simple language and real-world examples:\n\n',
    category: 'Education',
  },
  {
    title: 'Bug Fixer',
    content: 'The following code has a bug. Identify what is wrong, explain why it fails, and provide a corrected version:\n\n',
    category: 'Development',
  },
  {
    title: 'Email Writer',
    content: 'Write a professional, concise email for the following situation. Use a friendly but formal tone:\n\n',
    category: 'Business',
  },
  {
    title: 'Content Summarizer',
    content: 'Summarize the following content into clear, actionable bullet points. Highlight the most important insights:\n\n',
    category: 'Writing',
  },
  {
    title: 'Marketing Copy',
    content: 'Write compelling marketing copy for the following product or service. Focus on benefits, not features:\n\n',
    category: 'Marketing',
  },
]

export default function PromptsPage() {
  const { prompts, isLoading, createPrompt, deletePrompt, isCreating } =
    usePrompts()

  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SavedPrompt | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [form, setForm] = useState({ title: '', content: '', category: '' })
  const [copied, setCopied] = useState<string | null>(null)

  const categories = [
    'All',
    ...Array.from(new Set(prompts.map((p) => p.category).filter(Boolean))),
  ]

  const filtered = prompts.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    return matchSearch && matchCat
  })

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('Title is required.'); return }
    if (!form.content.trim()) { toast.error('Content is required.'); return }
    try {
      await createPrompt(form)
      setForm({ title: '', content: '', category: '' })
      setShowCreate(false)
      toast.success('Prompt saved.')
    } catch {
      toast.error('Failed to save prompt.')
    }
  }

  const handleCopy = async (p: SavedPrompt) => {
    await navigator.clipboard.writeText(p.content)
    setCopied(p.id)
    toast.success('Copied to clipboard.')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleTemplate = (t: typeof QUICK_TEMPLATES[0]) => {
    setForm({ title: t.title, content: t.content, category: t.category })
    setShowCreate(true)
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Prompt Library</h1>
          <p className="text-gray-500 text-sm">
            {prompts.length} saved prompt{prompts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={15} />
          New Prompt
        </Button>
      </div>

      {/* Quick templates (shown when empty) */}
      {!isLoading && prompts.length === 0 && (
        <div className="mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            Quick Start Templates
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_TEMPLATES.map((t) => (
              <button
                key={t.title}
                onClick={() => handleTemplate(t)}
                className="bg-surface-600 border border-white/8 rounded-xl p-4 text-left hover:border-brand-500/40 hover:bg-surface-500 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-white">{t.title}</p>
                  <Badge
                    variant={
                      CATEGORY_COLORS[t.category] ?? 'default'
                    }
                  >
                    {t.category}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {t.content}
                </p>
                <p className="text-xs text-brand-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to save →
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + filter */}
      {prompts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts…"
            className="flex-1 bg-surface-600 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-500/50 transition-colors"
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-600 border border-white/8 text-gray-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="w-6 h-6" />
        </div>
      ) : filtered.length === 0 && prompts.length > 0 ? (
        <EmptyState
          icon={<BookMarked size={36} />}
          title="No prompts match your search"
          description="Try a different search term or category filter."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookMarked size={36} />}
          title="No prompts saved yet"
          description="Save frequently used prompts for quick access. Use the templates above to get started."
          action={
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} />
              Create First Prompt
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-surface-600 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all group flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-white line-clamp-1 flex-1">
                  {p.title}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopy(p)}
                    title="Copy"
                    className="text-gray-600 hover:text-brand-400 transition-colors"
                  >
                    <Clipboard size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    title="Delete"
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {p.category && (
                <div className="mb-2.5">
                  <Badge variant={CATEGORY_COLORS[p.category] ?? 'default'}>
                    <Tag size={9} className="mr-1" />
                    {p.category}
                  </Badge>
                </div>
              )}

              <p className="text-gray-400 text-xs leading-relaxed line-clamp-4 flex-1">
                {p.content}
              </p>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <p className="text-gray-700 text-[10px]">{formatDate(p.created_at)}</p>
                {copied === p.id && (
                  <span className="text-[10px] text-green-400">✓ Copied</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false)
          setForm({ title: '', content: '', category: '' })
        }}
        title="Save New Prompt"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Code Reviewer"
          />
          <Input
            label="Category (optional)"
            value={form.category}
            onChange={(e) =>
              setForm((p) => ({ ...p, category: e.target.value }))
            }
            placeholder="e.g. Development"
          />
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">
              Prompt Content
            </label>
            <textarea
              value={form.content}
              onChange={(e) =>
                setForm((p) => ({ ...p, content: e.target.value }))
              }
              rows={6}
              placeholder="Write your reusable prompt here…"
              className="w-full bg-surface-500 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none resize-none focus:border-brand-500/50 transition-colors"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowCreate(false)
                setForm({ title: '', content: '', category: '' })
              }}
            >
              Cancel
            </Button>
            <Button size="sm" loading={isCreating} onClick={handleCreate}>
              Save Prompt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return
          deletePrompt(deleteTarget.id)
          setDeleteTarget(null)
          toast.success('Prompt deleted.')
        }}
        title="Delete Prompt"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}