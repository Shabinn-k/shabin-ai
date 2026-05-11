import { cn } from '@/lib/utils'

interface AvatarProps {
  name?: string
  src?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-xl',
}

export function Avatar({ name, src, size = 'sm', className }: AvatarProps) {
  const initial = name?.[0]?.toUpperCase() ?? '?'
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center font-bold flex-shrink-0',
        sizeMap[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? 'avatar'}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  )
}