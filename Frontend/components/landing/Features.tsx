'use client'

import { motion } from 'framer-motion'
import { Zap, Code2, Lock, FileUp, Brain, History } from 'lucide-react'

const FEATURES = [
  { icon: Zap, title: 'Real-time Streaming', desc: 'Watch responses appear token by token via SSE streaming — zero lag, maximum flow.', color: 'from-brand-600/20 to-brand-600/5' },
  { icon: Code2, title: 'Code Excellence', desc: 'Syntax highlighted code blocks for 50+ languages. Debug, refactor, explain — all in one.', color: 'from-blue-600/20 to-blue-600/5' },
  { icon: Brain, title: 'Gemini Intelligence', desc: "Google's most capable model powers every response — deep reasoning, nuanced answers.", color: 'from-green-600/20 to-green-600/5' },
  { icon: FileUp, title: 'File Upload', desc: 'Attach PDFs, images, and documents. Ask questions about their content directly.', color: 'from-amber-600/20 to-amber-600/5' },
  { icon: History, title: 'Persistent History', desc: 'Every conversation saved to your account. Pick up exactly where you left off.', color: 'from-pink-600/20 to-pink-600/5' },
  { icon: Lock, title: 'Secure by Design', desc: 'JWT auth, bcrypt passwords, refresh token rotation, Google OAuth — enterprise-grade security.', color: 'from-purple-600/20 to-purple-600/5' },
]

export default function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything you need
          </h2>
          <p className="text-gray-400 text-lg">
            Built for developers, designers, writers, and everyone in between.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className={`bg-gradient-to-br ${f.color} border border-white/8 rounded-2xl p-6 hover:border-white/15 hover:-translate-y-1 transition-all`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                <f.icon size={18} className="text-white" />
              </div>
              <h3 className="text-white font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}