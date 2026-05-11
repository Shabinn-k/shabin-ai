'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import type { UsageStats } from '@/types'

export default function UsagePage() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/api/usage')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner className="w-6 h-6" />
      </div>
    )
  }

  const CARDS = [
    { label: 'Total Messages', value: stats?.total_messages?.toLocaleString() ?? '0' },
    { label: 'Prompt Tokens', value: stats?.total_prompt_tokens?.toLocaleString() ?? '0' },
    { label: 'Response Tokens', value: stats?.total_response_tokens?.toLocaleString() ?? '0' },
    { label: 'Est. Cost (USD)', value: `$${(stats?.total_cost_usd ?? 0).toFixed(4)}` },
  ]

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">API Usage</h1>
        <p className="text-gray-500 text-sm">Your AI usage statistics and cost breakdown</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CARDS.map((c) => (
          <div key={c.label} className="bg-surface-600 border border-white/8 rounded-2xl p-5">
            <p className="text-xs text-gray-500 mb-2">{c.label}</p>
            <p className="text-2xl font-bold text-white">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-600 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-gray-300">Recent Usage</h2>
        </div>
        {!stats?.recent?.length ? (
          <div className="py-16 text-center text-gray-600 text-sm">
            No usage data yet. Start chatting!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-600 border-b border-white/5 uppercase tracking-wider">
                  {['Date', 'Model', 'Prompt Tokens', 'Response Tokens', 'Cost'].map((h) => (
                    <th key={h} className="text-left px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.recent.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-500/50 transition-colors">
                    <td className="px-5 py-3 text-gray-400">{formatDate(r.created_at)}</td>
                    <td className="px-5 py-3 text-white font-mono text-xs">{r.model}</td>
                    <td className="px-5 py-3 text-gray-300">{r.prompt_tokens}</td>
                    <td className="px-5 py-3 text-gray-300">{r.response_tokens}</td>
                    <td className="px-5 py-3 text-green-400 font-mono">${r.cost_usd.toFixed(6)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}