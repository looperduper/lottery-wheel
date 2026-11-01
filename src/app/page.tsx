'use client'

import { useState } from 'react'
import PlayerRegistration from '@/components/PlayerRegistration'
import LotteryWheel from '@/components/LotteryWheel'
import WinnersList from '@/components/WinnersList'

export default function Home() {
  const [players, setPlayers] = useState<string[]>([])
  const [winners, setWinners] = useState<string[]>([])
  const [numberOfWinners, setNumberOfWinners] = useState<number>(1)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const addPlayer = (playerName: string) => {
    const name = playerName.trim()
    if (!name) return
    if (players.includes(name)) {
      setError(`"${name}" is already registered.`)
      return
    }
    setError('')
    setPlayers([...players, name])
  }

  const removePlayer = (playerName: string) => {
    setPlayers(players.filter(p => p !== playerName))
  }

  const clearAllPlayers = () => {
    setPlayers([])
    setWinners([])
    setError('')
  }

  // Keep the requested winner count within [1, players.length]
  const safeWinnerCount = Math.min(
    Math.max(1, numberOfWinners),
    Math.max(1, players.length),
  )

  const startDraw = () => {
    if (players.length === 0) {
      setError('Add at least one player before drawing.')
      return
    }
    if (players.length < safeWinnerCount) {
      setError('Not enough players for that many winners.')
      return
    }

    setError('')
    setIsDrawing(true)
    setWinners([])

    // Shuffle, then reveal winners one at a time for suspense.
    const drawSequentially = async () => {
      const shuffled = [...players].sort(() => Math.random() - 0.5)
      const selectedWinners: string[] = []

      // Let the wheel spin before the first reveal.
      await new Promise(resolve => setTimeout(resolve, 2600))

      for (let i = 0; i < safeWinnerCount; i++) {
        selectedWinners.push(shuffled[i])
        setWinners([...selectedWinners])
        await new Promise(resolve => setTimeout(resolve, 700))
      }
      setIsDrawing(false)
    }

    drawSequentially()
  }

  const canDraw = players.length > 0 && !isDrawing

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-10%,#3b1d6e_0%,transparent_60%),linear-gradient(160deg,#160f2e_0%,#0b0718_55%,#07040f_100%)]">
      <div className="container mx-auto px-4 py-10 sm:py-14 max-w-6xl">
        <header className="text-center mb-10">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.35em] text-amber-300/80 uppercase mb-3">
            Spin · Draw · Celebrate
          </p>
          <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(251,191,36,0.25)]">
            🎰 Lottery Wheel
          </h1>
          <p className="mt-3 text-white/60 text-sm sm:text-base">
            Register players and draw winners one by one with a suspenseful spin.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mx-auto mb-6 max-w-2xl rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-3 text-center text-sm font-medium text-red-100"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* Player Registration */}
          <div className="lg:col-span-1">
            <PlayerRegistration
              players={players}
              onAddPlayer={addPlayer}
              onRemovePlayer={removePlayer}
              onClearAll={clearAllPlayers}
            />
          </div>

          {/* Wheel */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white/[0.07] backdrop-blur-md p-6 border border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
              <div className="mb-5">
                <label
                  htmlFor="winner-count"
                  className="block text-white font-semibold mb-2 text-sm"
                >
                  Winners to draw
                </label>
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    aria-label="Decrease winners"
                    onClick={() => setNumberOfWinners(n => Math.max(1, n - 1))}
                    disabled={isDrawing || safeWinnerCount <= 1}
                    className="w-11 rounded-lg bg-white/10 text-white text-lg font-bold border border-white/20 hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <input
                    id="winner-count"
                    type="number"
                    min={1}
                    max={players.length || 1}
                    value={safeWinnerCount}
                    disabled={isDrawing}
                    onChange={e =>
                      setNumberOfWinners(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="flex-1 text-center px-3 py-2 rounded-lg bg-white/15 text-white font-semibold border border-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    aria-label="Increase winners"
                    onClick={() =>
                      setNumberOfWinners(n =>
                        Math.min(Math.max(1, players.length), n + 1),
                      )
                    }
                    disabled={isDrawing || safeWinnerCount >= players.length}
                    className="w-11 rounded-lg bg-white/10 text-white text-lg font-bold border border-white/20 hover:bg-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              <LotteryWheel
                players={players}
                isDrawing={isDrawing}
                winners={winners}
              />

              <button
                onClick={startDraw}
                disabled={!canDraw}
                className="w-full mt-5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:from-gray-500 disabled:to-gray-600 text-slate-900 disabled:text-white/70 font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-100 disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-transparent"
              >
                {isDrawing ? '🎰 Drawing…' : '🎲 Start Draw'}
              </button>
            </div>
          </div>

          {/* Winners */}
          <div className="lg:col-span-1">
            <WinnersList winners={winners} isDrawing={isDrawing} />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-10 flex items-center justify-center gap-4 text-white/70 text-sm">
          <span className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5">
            Players: <strong className="text-white">{players.length}</strong>
          </span>
          <span className="rounded-full bg-white/5 border border-white/10 px-4 py-1.5">
            Drawing: <strong className="text-white">{safeWinnerCount}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
