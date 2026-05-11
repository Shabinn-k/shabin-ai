import { cn } from '@/lib/utils'

export function Divider({
  label,
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div className={cn('relative my-4', className)}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/5" />
      </div>
      {label && (
        <div className="relative flex justify-center">
          <span className="bg-surface-800 px-3 text-xs text-gray-600">
            {label}
          </span>
        </div>
      )}
    </div>
  )
}
