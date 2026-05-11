import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: ReactNode
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-surface-600 border border-white/8 rounded-2xl p-5',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-500">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-brand-600/15 border border-brand-600/20 flex items-center justify-center text-brand-400">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {trend && (
        <p
          className={cn(
            'text-xs',
            trend.value >= 0 ? 'text-green-400' : 'text-red-400'
          )}
        >
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  )
}
