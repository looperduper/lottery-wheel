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
  onClearAll 
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
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
        👥 Register Players
      </h2>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Enter player name..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
          >
            ➕ Add
          </button>
        </div>
      </form>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-white">
            Players ({players.length})
          </h3>
          {players.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded transition-colors"
            >
              🗑️ Clear All
            </button>
          )}
        </div>
        
        <div className="max-h-64 overflow-y-auto space-y-2">
          {players.length === 0 ? (
            <p className="text-white/60 italic text-center py-4">
              No players registered yet
            </p>
          ) : (
            players.map((player, index) => (
              <div
                key={player}
                className="flex justify-between items-center bg-white/10 rounded-lg p-3 border border-white/20"
              >
                <span className="text-white font-medium">
                  {index + 1}. {player}
                </span>
                <button
                  onClick={() => onRemovePlayer(player)}
                  className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                >
                  ❌
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {players.length > 0 && (
        <div className="text-center text-white/80 text-sm">
          Ready to draw from {players.length} player{players.length !== 1 ? 's' : ''}!
        </div>
      )}
    </div>
  )
}