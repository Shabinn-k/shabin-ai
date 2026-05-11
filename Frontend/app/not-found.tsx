import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4 text-center">
      <div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-2xl mx-auto mb-6 shadow-[0_0_40px_rgba(124,58,237,0.3)]">
          ✦
        </div>
        <h1 className="text-6xl font-bold text-white mb-3">404</h1>
        <p className="text-gray-400 text-lg mb-2">Page not found</p>
        <p className="text-gray-600 text-sm mb-8 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-blue-600 text-white rounded-xl font-medium hover:opacity-90 transition-all"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}