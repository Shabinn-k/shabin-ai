'use client'

import { motion } from 'framer-motion'

const TESTIMONIALS = [
  { name: 'Arjun Mehta', role: 'Full-Stack Developer', avatar: 'AM', text: 'Shabin AI has completely changed how I code. The streaming responses and syntax highlighting are incredibly smooth. I ship 2x faster.' },
  { name: 'Priya Nair', role: 'Product Manager', avatar: 'PN', text: 'I use it daily for PRDs, emails, and user research analysis. The conversation history is a lifesaver — always right where I left off.' },
  { name: 'Marcus Kim', role: 'Startup Founder', avatar: 'MK', text: 'Built our entire MVP with Shabin AI assistance. The Gemini model produces genuinely impressive code. Like having a senior engineer on speed dial.' },
]

export default function Testimonials() {
  return (
    <section className="py-24 px-6 bg-surface-800/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Loved by builders</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              className="bg-surface-600 border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-600 to-blue-600 flex items-center justify-center text-xs font-bold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}