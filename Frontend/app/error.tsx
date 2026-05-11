'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4 text-center">
      <div>
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-3xl mx-auto mb-6">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gradient-to-r from-brand-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
