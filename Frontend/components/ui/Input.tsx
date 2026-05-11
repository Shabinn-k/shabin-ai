'use client'

import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all',
          'focus:border-brand-500/60 focus:bg-white/8',
          error && 'border-red-500/50 focus:border-red-500/60',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400 mt-1.5">{error}</p>
      )}
    </div>
  )
)
Input.displayName = 'Input'