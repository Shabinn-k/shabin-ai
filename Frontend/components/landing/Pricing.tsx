'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['50 messages / day', 'Gemini Flash model', 'Chat history (7 days)', 'Community support'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/month',
    features: ['Unlimited messages', 'Gemini Pro & Ultra', 'Full chat history', 'File uploads (10 MB)', 'Priority support', 'API access'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$39',
    period: '/month',
    features: ['Everything in Pro', 'Up to 10 seats', 'Admin dashboard', 'Usage analytics', 'SSO / Google Workspace', 'SLA & dedicated support'],
    cta: 'Contact Sales',
    highlight: false,
  },
]

export default function Pricing() {
  const router = useRouter()
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Simple pricing</h2>
          <p className="text-gray-400">No hidden fees. Cancel anytime.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              className={`rounded-2xl p-8 flex flex-col ${
                p.highlight
                  ? 'bg-gradient-to-b from-brand-600/25 to-blue-600/10 border-2 border-brand-500/50'
                  : 'bg-surface-600 border border-white/8'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {p.highlight && (
                <span className="text-xs text-brand-300 bg-brand-500/20 border border-brand-500/30 rounded-full px-3 py-1 w-fit mb-4 font-medium">
                  Most Popular
                </span>
              )}
              <p className="text-gray-400 text-sm mb-2">{p.name}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-white">{p.price}</span>
              </div>
              <p className="text-gray-500 text-sm mb-8">{p.period}</p>
              <ul className="space-y-3 flex-1 mb-8">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check size={14} className="text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push('/signup')}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                  p.highlight
                    ? 'bg-gradient-to-r from-brand-600 to-blue-600 text-white hover:opacity-90 shadow-[0_0_20px_rgba(124,58,237,0.3)]'
                    : 'bg-surface-500 border border-white/10 text-white hover:bg-surface-400'
                }`}
              >
                {p.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}