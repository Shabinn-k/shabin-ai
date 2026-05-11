export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-fade-in">
      {/* AI Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-[0_0_12px_rgba(124,58,237,0.3)] mt-0.5">
        ✦
      </div>
      <div className="flex items-center gap-1.5 bg-surface-600 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
        {[0, 0.2, 0.4].map((delay, i) => (
          <span
            key={i}
            className="w-2 h-2 bg-brand-500 rounded-full"
            style={{ animation: `bounceDot 1.4s ease-in-out ${delay}s infinite` }}
          />
        ))}
      </div>
    </div>
  )
}