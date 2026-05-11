'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, BookMarked } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate, truncate } from '@/lib/utils'
import type { SavedPrompt } from '@/types'

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get('/api/prompts')
      .then(({ data }) => setPrompts(data.prompts ?? []))
      .catch(() => toast.error('Failed to load prompts.'))
      .finally(() => setLoading(false))
  }, [])

  const create = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required.')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post('/api/prompts', form)
      setPrompts((p) => [data.prompt, ...p])
      setForm({ title: '', content: '', category: '' })
      setShowModal(false)
      toast.success('Prompt saved.')
    } catch {
      toast.error('Failed to save prompt.')
    } finally {
      setSaving(false)
    }
  }

  const del = async (id: string) => {
    try {
      await api.delete(`/api/prompts/${id}`)
      setPrompts((p) => p.filter((x) => x.id !== id))
      toast.success('Prompt deleted.')
    } catch {
      toast.error('Failed to delete.')
    }
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Saved Prompts</h1>
          <p className="text-gray-500 text-sm">
            Your reusable prompt templates
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={15} />
          New Prompt
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="w-6 h-6" />
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-20">
          <BookMarked size={36} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No prompts saved yet.</p>
          <p className="text-gray-600 text-sm mt-1">
            Save frequently used prompts for quick access.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {prompts.map((p) => (
            <div
              key={p.id}
              className="bg-surface-600 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-white line-clamp-1">
                  {p.title}
                </h3>
                <button
                  onClick={() => del(p.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              {p.category && (
                <span className="text-[10px] text-gray-500 bg-surface-500 border border-white/5 rounded-full px-2 py-0.5">
                  {p.category}
                </span>
              )}
              <p className="text-gray-400 text-xs mt-3 leading-relaxed line-clamp-3">
                {p.content}
              </p>
              <p className="text-gray-700 text-[10px] mt-4">
                {formatDate(p.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Prompt">
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
              rows={5}
              placeholder="Review this code for bugs, performance issues, and best practices:&#10;&#10;"
              className="w-full bg-surface-500 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none resize-none focus:border-brand-500/50 transition-colors"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={create}>
              Save Prompt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}