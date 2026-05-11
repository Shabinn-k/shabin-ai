import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-white/5 border-white/10 text-gray-400',
    success: 'bg-green-500/20 border-green-500/30 text-green-400',
    warning: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    purple: 'bg-brand-600/20 border-brand-600/30 text-brand-400',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center border rounded-full px-2 py-0.5 text-[10px] font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}