import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'  
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Shabin AI — Your Intelligent Assistant',
  description:
    'Next-generation AI chat platform powered by Gemini. Write code, analyze data, and solve problems instantly.',
  metadataBase: new URL('https://shabin.ai'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-surface-900 text-white antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}