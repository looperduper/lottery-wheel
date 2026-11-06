'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import PlayerRegistration from './PlayerRegistration'
import LotteryWheel from './LotteryWheel'
import WinnersList from './WinnersList'
import { LotterySnapshot } from '@/lib/lotteryTypes'

type Conn = 'connecting' | 'live' | 'offline'

const hostKey = (id: string) => `lw_host_${id}`

export default function DrawRoom({ id }: { id: string }) {
  const [snap, setSnap] = useState<LotterySnapshot | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [conn, setConn] = useState<Conn>('connecting')
  const [hostToken, setHostToken] = useState<string | null>(null)
  const [numberOfWinners, setNumberOfWinners] = useState(1)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const touchedCount = useRef(false)

  // Resolve host token + share URL on the client only.
  useEffect(() => {
    try {
      setHostToken(localStorage.getItem(hostKey(id)))
    } catch {
      setHostToken(null)
    }
    setShareUrl(window.location.href)
  }, [id])

  const isHost = !!hostToken

  // Initial snapshot, then live stream.
  useEffect(() => {
    let closed = false
    let es: EventSource | null = null

    fetch(`/api/lotteries/${id}`)
      .then(async res => {
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        const data: LotterySnapshot = await res.json()
        if (closed) return
        setSnap(data)

        es = new EventSource(`/api/lotteries/${id}/stream`)
        es.onopen = () => setConn('live')
        es.onmessage = e => {
          try {
            setSnap(JSON.parse(e.data))
            setConn('live')
          } catch {
            // ignore malformed frame
          }
        }
        es.onerror = () => setConn('offline') // EventSource auto-retries
      })
      .catch(() => setConn('offline'))

    return () => {
      closed = true
      es?.close()
    }
  }, [id])

  const players = snap?.players ?? []
  const drawing = snap?.status === 'spinning' || snap?.status === 'resting'
  const maxWinners = Math.max(1, players.length)

  // Keep the host's requested count sensible as players come and go.
  useEffect(() => {
    if (!touchedCount.current && snap) {
      setNumberOfWinners(Math.min(Math.max(1, snap.numberOfWinners), maxWinners))
    } else {
      setNumberOfWinners(n => Math.min(Math.max(1, n), maxWinners))
    }
  }, [maxWinners, snap])

  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const res = await fetch(`/api/lotteries/${id}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(hostToken ? { 'x-host-token': hostToken } : {}),
          ...(init.headers ?? {}),
        },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Request failed')
      }
      return res
    },
    [id, hostToken],
  )

  const run = (fn: () => Promise<unknown>) => {
    fn().catch(e => {
      setError(e.message || 'Something went wrong')
      setTimeout(() => setError(''), 3500)
    })
  }

  const addPlayer = (name: string) =>
    run(() => api('/players', { method: 'POST', body: JSON.stringify({ name }) }))
  const removePlayer = (name: string) =>
    run(() => api(`/players?name=${encodeURIComponent(name)}`, { method: 'DELETE' }))
  const clearAll = () => run(() => api('/players?all=1', { method: 'DELETE' }))
  const startDraw = () => {
    if (players.length === 0) {
      setError('Add at least one player before drawing.')
      setTimeout(() => setError(''), 3500)
      return
    }
    run(() => api('/draw', { method: 'POST', body: JSON.stringify({ count: numberOfWinners }) }))
  }
  const resetDraw = () => run(() => api('/draw', { method: 'DELETE' }))

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fall back to selecting the field so the viewer can copy manually.
      const el = document.getElementById('share-url') as HTMLInputElement | null
      el?.select()
    }
  }

  const connLabel = useMemo(
    () => ({ connecting: 'Connecting…', live: 'Live', offline: 'Reconnecting…' }[conn]),
    [conn],
  )

  if (notFound) {
    return (
      <Shell>
        <div className="mx-auto max-w-md text-center rounded-2xl bg-white/[0.07] border border-white/15 p-10 mt-10">
          <div className="text-5xl mb-4">🎰</div>
          <h1 className="text-2xl font-bold text-white mb-2">Lottery not found</h1>
          <p className="text-white/60 mb-6">
            This draw doesn’t exist or expired after a server restart.
          </p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 font-extrabold px-6 py-3 rounded-xl"
          >
            Create a new draw
          </Link>
        </div>
      </Shell>
    )
  }

  const canDraw = isHost && !drawing && players.length > 0
  const showReset = isHost && !drawing && (snap?.winners.length ?? 0) > 0

  return (
    <Shell>
      {/* Live status + share bar */}
      <div className="mx-auto mb-6 max-w-3xl flex flex-col sm:flex-row items-stretch gap-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] border border-white/15 px-4 py-2.5 text-sm">
          <span className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                conn === 'live' ? 'bg-emerald-400' : conn === 'connecting' ? 'bg-amber-400' : 'bg-red-400'
              } ${conn === 'live' ? 'animate-pulse' : ''}`}
            />
            <span className="text-white/80">{connLabel}</span>
          </span>
          <span className="text-white/30">•</span>
          <span className="text-white/80">
            👁 {snap?.viewers ?? 1} watching
          </span>
          <span className="text-white/30">•</span>
          <span className={isHost ? 'text-amber-300 font-semibold' : 'text-white/60'}>
            {isHost ? 'You are the host' : 'Viewer'}
          </span>
        </div>

        <div className="flex-1 flex items-center gap-2 rounded-xl bg-white/[0.06] border border-white/15 px-3 py-2">
          <input
            id="share-url"
            readOnly
            value={shareUrl}
            onFocus={e => e.currentTarget.select()}
            className="flex-1 min-w-0 bg-transparent text-white/80 text-sm focus:outline-none"
            aria-label="Shareable link"
          />
          <button
            onClick={copyLink}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-400 text-slate-900 text-sm font-bold hover:bg-amber-300 transition"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mx-auto mb-6 max-w-2xl rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-3 text-center text-sm font-medium text-red-100"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Players: editable for host, read-only for viewers */}
        <div className="lg:col-span-1">
          {isHost ? (
            <PlayerRegistration
              players={players}
              onAddPlayer={addPlayer}
              onRemovePlayer={removePlayer}
              onClearAll={clearAll}
              disabled={drawing}
            />
          ) : (
            <ReadOnlyPlayers players={players} />
          )}
        </div>

        {/* Wheel */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white/[0.07] backdrop-blur-md p-6 border border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
            {isHost ? (
              <div className="mb-5">
                <label htmlFor="winner-count" className="block text-white font-semibold mb-2 text-sm">
                  Winners to draw
                </label>
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    aria-label="Decrease winners"
                    onClick={() => {
                      touchedCount.current = true
                      setNumberOfWinners(n => Math.max(1, n - 1))
                    }}
                    disabled={drawing || numberOfWinners <= 1}
                    className="w-11 rounded-lg bg-white/10 text-white text-lg font-bold border border-white/20 hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <input
                    id="winner-count"
                    type="number"
                    min={1}
                    max={maxWinners}
                    value={numberOfWinners}
                    disabled={drawing}
                    onChange={e => {
                      touchedCount.current = true
                      setNumberOfWinners(Math.max(1, parseInt(e.target.value) || 1))
                    }}
                    className="flex-1 text-center px-3 py-2 rounded-lg bg-white/15 text-white font-semibold border border-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    aria-label="Increase winners"
                    onClick={() => {
                      touchedCount.current = true
                      setNumberOfWinners(n => Math.min(maxWinners, n + 1))
                    }}
                    disabled={drawing || numberOfWinners >= maxWinners}
                    className="w-11 rounded-lg bg-white/10 text-white text-lg font-bold border border-white/20 hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <p className="mb-5 text-center text-sm text-white/60">
                👀 You’re watching live — only the host can draw.
              </p>
            )}

            <LotteryWheel
              players={players}
              winners={snap?.winners ?? []}
              rotation={snap?.rotation ?? 0}
              spinning={snap?.spinning ?? false}
              spinDurationMs={snap?.spinDurationMs ?? 2600}
              status={snap?.status ?? 'idle'}
            />

            {isHost && (
              <div className="mt-5 flex gap-2">
                <button
                  onClick={startDraw}
                  disabled={!canDraw}
                  className="flex-1 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:from-gray-500 disabled:to-gray-600 text-slate-900 disabled:text-white/70 font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-100 disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-300"
                >
                  {drawing ? '🎰 Drawing…' : '🎲 Start Draw'}
                </button>
                {showReset && (
                  <button
                    onClick={resetDraw}
                    className="px-5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Winners */}
        <div className="lg:col-span-1">
          <WinnersList winners={snap?.winners ?? []} isDrawing={drawing} />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-10 flex items-center justify-center gap-4 text-white/70 text-sm flex-wrap">
        <span className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5">
          Players: <strong className="text-white">{players.length}</strong>
        </span>
        <span className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5">
          Winners: <strong className="text-white">{snap?.winners.length ?? 0}</strong>
        </span>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b1d6e_0%,transparent_60%),linear-gradient(160deg,#160f2e_0%,#0b0718_55%,#07040f_100%)]">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-6xl">
        <header className="text-center mb-8">
          <Link
            href="/"
            className="text-3xl md:text-5xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(251,191,36,0.25)]"
          >
            🎰 Lottery Wheel
          </Link>
        </header>
        {children}
      </div>
    </div>
  )
}

function ReadOnlyPlayers({ players }: { players: string[] }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] backdrop-blur-md p-6 border border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span aria-hidden>👥</span> Players ({players.length})
      </h2>
      <div className="scroll-slim max-h-96 overflow-y-auto space-y-2 pr-1">
        {players.length === 0 ? (
          <p className="text-white/50 italic text-center py-8">
            Waiting for the host to add players…
          </p>
        ) : (
          players.map((player, index) => (
            <div
              key={player}
              className="flex items-center gap-3 bg-white/[0.06] rounded-lg px-3 py-2.5 border border-white/15"
            >
              <span className="shrink-0 grid place-items-center w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
                {index + 1}
              </span>
              <span className="text-white font-medium truncate">{player}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
