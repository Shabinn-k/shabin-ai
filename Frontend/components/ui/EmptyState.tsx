import { type ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="text-gray-700 mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-gray-400 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 max-w-xs mb-5">{description}</p>
      )}
      {action}
    </div>
  )
}