'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [joinUrl, setJoinUrl] = useState('')
  const [error, setError] = useState('')

  const createDraw = async () => {
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/lotteries', { method: 'POST' })
      if (!res.ok) throw new Error('Could not create a draw')
      const { id, hostToken } = await res.json()
      try {
        localStorage.setItem(`lw_host_${id}`, hostToken)
      } catch {
        // Host controls just won't persist if storage is blocked.
      }
      router.push(`/draw/${id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setCreating(false)
    }
  }

  const join = (e: React.FormEvent) => {
    e.preventDefault()
    const value = joinUrl.trim()
    if (!value) return
    // Accept a full link or a bare id.
    const match = value.match(/\/draw\/([a-z0-9]+)/i)
    const id = match ? match[1] : value
    router.push(`/draw/${id}`)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b1d6e_0%,transparent_60%),linear-gradient(160deg,#160f2e_0%,#0b0718_55%,#07040f_100%)]">
      <div className="container mx-auto px-4 py-16 sm:py-24 max-w-2xl">
        <header className="text-center mb-10">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.35em] text-amber-300/80 uppercase mb-3">
            Spin · Draw · Celebrate
          </p>
          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(251,191,36,0.25)]">
            🎰 Lottery Wheel
          </h1>
          <p className="mt-4 text-white/60 text-base sm:text-lg">
            Create a draw, share the link, and let everyone watch the wheel spin live.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-3 text-center text-sm font-medium text-red-100"
          >
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-white/[0.07] backdrop-blur-md p-8 border border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
          <button
            onClick={createDraw}
            disabled={creating}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-60 text-slate-900 font-extrabold text-lg py-4 px-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-100 disabled:scale-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            {creating ? 'Creating…' : '🎲 Create a new draw'}
          </button>
          <p className="mt-3 text-center text-white/50 text-sm">
            You’ll get a shareable link. As the host, you register players and start the draw.
          </p>

          <div className="my-7 flex items-center gap-3 text-white/30 text-xs uppercase tracking-widest">
            <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={join}>
            <label htmlFor="join" className="block text-white font-semibold mb-2 text-sm">
              Join a draw
            </label>
            <div className="flex gap-2">
              <input
                id="join"
                type="text"
                value={joinUrl}
                onChange={e => setJoinUrl(e.target.value)}
                placeholder="Paste a draw link…"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-white/15 text-white placeholder-white/50 border border-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="submit"
                disabled={!joinUrl.trim()}
                className="px-5 py-2.5 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
