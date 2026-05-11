'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function Hero() {
  const router = useRouter()
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 text-center overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-blue-600/8 rounded-full blur-[80px]" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <motion.div
        className="relative z-10 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <motion.div
          className="inline-flex items-center gap-2 bg-surface-600 border border-white/10 rounded-full px-4 py-1.5 text-xs text-brand-400 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Sparkles size={12} />
          Powered by Gemini AI · Built for Makers
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          <span className="text-white">Your Personal</span>
          <br />
          <span className="text-gradient">Intelligent Assistant</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Shabin AI brings the power of Gemini to your fingertips. Write code, analyze data,
          craft content, and solve problems — instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.push('/signup')}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-[0_0_30px_rgba(124,58,237,0.3)]"
          >
            Get Started Free
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => router.push('/login')}
            className="px-8 py-4 bg-surface-600 border border-white/10 text-white rounded-xl font-semibold hover:bg-surface-500 hover:border-white/20 transition-all"
          >
            Sign In
          </button>
        </div>

        <p className="text-xs text-gray-700 mt-5">
          No credit card required · Free tier available
        </p>
      </motion.div>
    </section>
  )
}
