'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'

export default function ImagePage() {
  const [prompt, setPrompt] = useState('')

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">AI Image Generation</h1>
        <p className="text-gray-500 text-sm">
          Generate stunning images with DALL·E 3 or Stable Diffusion
        </p>
      </div>

      <div className="bg-surface-600 border border-white/8 rounded-2xl p-6 mb-5">
        <label className="block text-sm text-gray-400 mb-2">
          Describe your image
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="A futuristic city skyline at sunset with neon lights reflecting on water, cinematic photography…"
          className="w-full bg-surface-500 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none resize-none focus:border-brand-500/50 transition-colors mb-4"
        />
        <Button
          onClick={() =>
            toast.info('Connect an image generation API key in Settings to enable this feature.')
          }
          disabled={!prompt.trim()}
        >
          <Wand2 size={15} />
          Generate Image
        </Button>
      </div>

      <div className="bg-surface-600 border border-dashed border-white/10 rounded-2xl p-12 text-center">
        <div className="text-4xl mb-4">🎨</div>
        <p className="text-gray-500 text-sm">
          Your generated images will appear here.
          <br />
          Connect DALL·E or Stable Diffusion in Settings.
        </p>
      </div>
    </div>
  )
}
