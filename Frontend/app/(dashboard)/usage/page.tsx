'use client'

import { BarChart2, Zap, DollarSign, MessageSquare } from 'lucide-react'
import { useUsage } from '@/hooks/useUsage'
import { StatCard } from '@/components/ui/StatCard'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

const MODEL_COLOR: Record<string, 'purple' | 'success' | 'warning' | 'default'> = {
  'gemini-1.5-pro': 'purple',
  'gemini-1.5-flash': 'success',
  'gemini-pro': 'warning',
}

export default function UsagePage() {
  const { stats, isLoading } = useUsage()

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner className="w-7 h-7" />
      </div>
    )
  }

  const STAT_CARDS = [
    {
      label: 'Total Messages',
      value: (stats?.total_messages ?? 0).toLocaleString(),
      icon: <MessageSquare size={15} />,
    },
    {
      label: 'Prompt Tokens',
      value: (stats?.total_prompt_tokens ?? 0).toLocaleString(),
      icon: <Zap size={15} />,
    },
    {
      label: 'Response Tokens',
      value: (stats?.total_response_tokens ?? 0).toLocaleString(),
      icon: <BarChart2 size={15} />,
    },
    {
      label: 'Estimated Cost',
      value: `$${(stats?.total_cost_usd ?? 0).toFixed(4)}`,
      icon: <DollarSign size={15} />,
    },
  ]

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">API Usage</h1>
        <p className="text-gray-500 text-sm">
          Gemini API usage and cost breakdown for your account
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            icon={c.icon}
          />
        ))}
      </div>

      {/* Token distribution bar */}
      {(stats?.total_prompt_tokens ?? 0) + (stats?.total_response_tokens ?? 0) > 0 && (
        <div className="bg-surface-600 border border-white/8 rounded-2xl p-5 mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Token Distribution
          </p>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-gray-400 w-24">Prompt</span>
            <div className="flex-1 bg-surface-400 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-brand-600 rounded-full transition-all"
                style={{
                  width: `${
                    ((stats?.total_prompt_tokens ?? 0) /
                      ((stats?.total_prompt_tokens ?? 0) +
                        (stats?.total_response_tokens ?? 0))) *
                    100
                  }%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 w-16 text-right">
              {stats?.total_prompt_tokens?.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-24">Response</span>
            <div className="flex-1 bg-surface-400 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{
                  width: `${
                    ((stats?.total_response_tokens ?? 0) /
                      ((stats?.total_prompt_tokens ?? 0) +
                        (stats?.total_response_tokens ?? 0))) *
                    100
                  }%`,
                }}
              />
            </div>
            <span className="text-xs text-gray-500 w-16 text-right">
              {stats?.total_response_tokens?.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Recent usage table */}
      <div className="bg-surface-600 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">Recent Usage</h2>
          <p className="text-xs text-gray-600">Last 20 interactions</p>
        </div>
        {!stats?.recent?.length ? (
          <div className="py-16 text-center">
            <BarChart2 size={32} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No usage data yet.</p>
            <p className="text-gray-600 text-xs mt-1">
              Start chatting to see your usage statistics here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-600 border-b border-white/5 uppercase tracking-wider">
                  {[
                    'Date',
                    'Model',
                    'Prompt Tokens',
                    'Response Tokens',
                    'Total Tokens',
                    'Cost',
                  ].map((h) => (
                    <th key={h} className="text-left px-5 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.recent.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-surface-500/50 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={MODEL_COLOR[r.model] ?? 'default'}>
                        {r.model}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-300 font-mono text-xs">
                      {r.prompt_tokens.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-gray-300 font-mono text-xs">
                      {r.response_tokens.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-gray-300 font-mono text-xs">
                      {(r.prompt_tokens + r.response_tokens).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-green-400 font-mono text-xs">
                      ${r.cost_usd.toFixed(6)}
                    </td>
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