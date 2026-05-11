import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './hooks/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          900: '#4c1d95',
        },
        surface: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#16161f',
          600: '#1c1c28',
          500: '#22223a',
          400: '#2a2a3d',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-dot': 'bounceDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'grad-brand': 'linear-gradient(135deg, #7c3aed, #3b82f6)',
        'grad-glow': 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}

export default config