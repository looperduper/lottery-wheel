'use client'

import { useState, useEffect } from 'react'
import PlayerRegistration from '@/components/PlayerRegistration'
import LotteryWheel from '@/components/LotteryWheel'
import WinnersList from '@/components/WinnersList'

export default function Home() {
  const [players, setPlayers] = useState<string[]>([])
  const [winners, setWinners] = useState<string[]>([])
  const [numberOfWinners, setNumberOfWinners] = useState<number>(1)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)

  const addPlayer = (playerName: string) => {
    if (playerName.trim() && !players.includes(playerName.trim())) {
      setPlayers([...players, playerName.trim()])
    }
  }

  const removePlayer = (playerName: string) => {
    setPlayers(players.filter(p => p !== playerName))
  }

  const clearAllPlayers = () => {
    setPlayers([])
    setWinners([])
  }

  const startDraw = () => {
    if (players.length < numberOfWinners) {
      alert('Not enough players registered!')
      return
    }
    
    setIsDrawing(true)
    setWinners([])
    
    // Simulate wheel spinning with sequential drawing
    const drawSequentially = async () => {
      const shuffled = [...players].sort(() => Math.random() - 0.5)
      const selectedWinners: string[] = []
      
      for (let i = 0; i < numberOfWinners; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay between each draw
        selectedWinners.push(shuffled[i])
        setWinners([...selectedWinners])
      }
      setIsDrawing(false)
    }
    
    drawSequentially()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          🎰 Lottery Wheel 🎰
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Player Registration Section */}
          <div className="lg:col-span-1">
            <PlayerRegistration 
              players={players}
              onAddPlayer={addPlayer}
              onRemovePlayer={removePlayer}
              onClearAll={clearAllPlayers}
            />
          </div>
          
          {/* Wheel Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="mb-4">
                <label className="block text-white font-semibold mb-2">
                  Number of Drawed Players:
                </label>
                <input
                  type="number"
                  min="1"
                  max={players.length || 1}
                  value={numberOfWinners}
                  onChange={(e) => setNumberOfWinners(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              
              <LotteryWheel 
                players={players}
                isDrawing={isDrawing}
                winners={winners}
              />
              
              <button
                onClick={startDraw}
                disabled={players.length === 0 || isDrawing}
                className="w-full mt-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                {isDrawing ? '🎰 Drawing...' : '🎲 Start Draw'}
              </button>
            </div>
          </div>
          
          {/* Winners Section */}
          <div className="lg:col-span-1">
            <WinnersList winners={winners} />
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-8 text-center text-white/80">
          <p>Total Players: {players.length} | Drawed Players: {numberOfWinners}</p>
        </div>
      </div>
    </div>
  )
}
