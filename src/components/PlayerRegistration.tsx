'use client'

import { useState } from 'react'

interface PlayerRegistrationProps {
  players: string[]
  onAddPlayer: (playerName: string) => void
  onRemovePlayer: (playerName: string) => void
  onClearAll: () => void
}

export default function PlayerRegistration({
  players,
  onAddPlayer,
  onRemovePlayer,
  onClearAll,
}: PlayerRegistrationProps) {
  const [newPlayerName, setNewPlayerName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPlayerName.trim()) {
      onAddPlayer(newPlayerName)
      setNewPlayerName('')
    }
  }

  return (
    <div className="rounded-2xl bg-white/[0.07] backdrop-blur-md p-6 border border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span aria-hidden>👥</span> Register Players
      </h2>

      <form onSubmit={handleSubmit} className="mb-5">
        <label htmlFor="player-name" className="sr-only">
          Player name
        </label>
        <div className="flex gap-2">
          <input
            id="player-name"
            type="text"
            value={newPlayerName}
            onChange={e => setNewPlayerName(e.target.value)}
            placeholder="Enter player name…"
            autoComplete="off"
            className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-white/15 text-white placeholder-white/50 border border-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            type="submit"
            disabled={!newPlayerName.trim()}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            Add
          </button>
        </div>
      </form>

      <div className="mb-1">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
            Players ({players.length})
          </h3>
          {players.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3 py-1 bg-red-500/90 hover:bg-red-500 text-white text-xs font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="scroll-slim max-h-72 overflow-y-auto space-y-2 pr-1">
          {players.length === 0 ? (
            <p className="text-white/50 italic text-center py-8">
              No players registered yet
            </p>
          ) : (
            players.map((player, index) => (
              <div
                key={player}
                className="group flex justify-between items-center gap-3 bg-white/[0.06] hover:bg-white/10 rounded-lg px-3 py-2.5 border border-white/15 transition-colors"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 grid place-items-center w-6 h-6 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-white font-medium truncate">
                    {player}
                  </span>
                </span>
                <button
                  onClick={() => onRemovePlayer(player)}
                  aria-label={`Remove ${player}`}
                  className="shrink-0 w-7 h-7 grid place-items-center rounded-md text-white/60 hover:text-white hover:bg-red-500/80 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {players.length > 0 && (
        <p className="mt-4 text-center text-white/60 text-sm">
          Ready to draw from {players.length} player
          {players.length !== 1 ? 's' : ''}!
        </p>
      )}
    </div>
  )
}
