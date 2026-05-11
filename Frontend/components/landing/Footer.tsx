export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6 bg-surface-800/40">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-xs">
            ✦
          </div>
          <span className="font-bold text-sm text-white">Shabin AI</span>
        </div>
        <nav className="flex gap-8">
          {['Privacy', 'Terms', 'Docs', 'Blog', 'Status'].map((l) => (
            <a
              key={l}
              href="#"
              className="text-sm text-gray-500 hover:text-white transition-colors"
            >
              {l}
            </a>
          ))}
        </nav>
        <p className="text-xs text-gray-700">
          © {new Date().getFullYear()} Shabin AI. All rights reserved.
        </p>
      </div>
    </footer>
  )
}