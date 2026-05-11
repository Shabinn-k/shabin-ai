export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-lg animate-pulse shadow-[0_0_20px_rgba(124,58,237,0.3)]">
          ✦
        </div>
        <div className="flex gap-1.5">
          {[0, 0.15, 0.3].map((delay, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-brand-500"
              style={{ animation: `bounceDot 1.4s ease-in-out ${delay}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
