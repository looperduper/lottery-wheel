'use client'

import { useEffect, useState } from 'react'

interface LotteryWheelProps {
  players: string[]
  isDrawing: boolean
  winners: string[]
}

export default function LotteryWheel({ players, isDrawing, winners }: LotteryWheelProps) {
  const [currentHighlight, setCurrentHighlight] = useState<number>(-1)
  const [wheelRotation, setWheelRotation] = useState<number>(0)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isDrawing && players.length > 0) {
      let highlightIndex = 0
      let rotationAmount = 0
      
      interval = setInterval(() => {
        highlightIndex = (highlightIndex + 1) % players.length
        rotationAmount += 30
        setCurrentHighlight(highlightIndex)
        setWheelRotation(rotationAmount)
      }, 100)

      // Stop spinning after 3 seconds
      setTimeout(() => {
        if (interval) {
          clearInterval(interval)
          setCurrentHighlight(-1)
          setWheelRotation(0)
        }
      }, 3000)
    } else {
      setCurrentHighlight(-1)
      setWheelRotation(0)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isDrawing, players.length])

  const wheelSize = 300
  const centerX = wheelSize / 2
  const centerY = wheelSize / 2
  const radius = wheelSize / 2 - 30

  const getPlayerPositions = () => {
    if (players.length === 0) return []
    
    return players.map((player, index) => {
      const angle = (index / players.length) * 2 * Math.PI - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius * 0.7
      const y = centerY + Math.sin(angle) * radius * 0.7
      return { player, x, y, angle: angle * (180 / Math.PI), index }
    })
  }

  const generateUniqueColor = (index: number, total: number) => {
    const hue = (index * 360) / total
    const saturation = 70 + (index % 3) * 10 // 70-90% saturation
    const lightness = 45 + (index % 4) * 10   // 45-75% lightness
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  const getWheelSegments = () => {
    if (players.length === 0) return []
    
    const segmentAngle = 360 / players.length
    
    return players.map((player, index) => {
      const startAngle = index * segmentAngle
      const endAngle = (index + 1) * segmentAngle
      
      const startRadians = (startAngle - 90) * (Math.PI / 180)
      const endRadians = (endAngle - 90) * (Math.PI / 180)
      
      const x1 = centerX + Math.cos(startRadians) * radius
      const y1 = centerY + Math.sin(startRadians) * radius
      const x2 = centerX + Math.cos(endRadians) * radius
      const y2 = centerY + Math.sin(endRadians) * radius
      
      const largeArcFlag = segmentAngle > 180 ? 1 : 0
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ')
      
      return { pathData, index, player, color: generateUniqueColor(index, players.length) }
    })
  }

  const playerPositions = getPlayerPositions()
  const wheelSegments = getWheelSegments()

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {players.length === 0 ? (
          <div className="w-72 h-72 rounded-full bg-gray-600 flex items-center justify-center border-8 border-gray-500">
            <div className="text-center text-white/60">
              <div className="text-4xl mb-2">🎰</div>
              <div className="text-sm">Add players to start</div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <svg 
              width={wheelSize} 
              height={wheelSize} 
              className="drop-shadow-2xl"
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transition: isDrawing ? 'none' : 'transform 0.5s ease-out'
              }}
            >
              {/* Wheel segments */}
              {wheelSegments.map(({ pathData, index, player, color }) => (
                <path
                  key={`segment-${index}`}
                  d={pathData}
                  fill={
                    winners.includes(player) 
                      ? '#10B981' // Green for winners
                      : currentHighlight === index 
                        ? '#F59E0B' // Yellow for current highlight
                        : color // Unique color for each player
                  }
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-colors duration-200"
                />
              ))}
              
              {/* Player names */}
              {playerPositions.map(({ player, x, y, angle, index }) => (
                <text
                  key={`text-${index}`}
                  x={x}
                  y={y}
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  transform={`rotate(${angle + 90}, ${x}, ${y})`}
                  className="pointer-events-none select-none"
                >
                  {player.length > 8 ? player.substring(0, 8) + '...' : player}
                </text>
              ))}
              
              {/* Center circle */}
              <circle
                cx={centerX}
                cy={centerY}
                r="25"
                fill="#1F2937"
                stroke="#ffffff"
                strokeWidth="3"
              />
              <text
                x={centerX}
                y={centerY}
                fill="white"
                fontSize="16"
                textAnchor="middle"
                dominantBaseline="central"
                className="font-bold"
              >
                🎰
              </text>
            </svg>
            
            {/* Wheel pointer */}
            <div 
              className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2"
              style={{ zIndex: 10 }}
            >
              <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[30px] border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-lg"></div>
            </div>
          </div>
        )}
        
        {/* Spinning effect overlay */}
        {isDrawing && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse pointer-events-none"></div>
        )}
      </div>
      
      {/* Status text */}
      <div className="mt-4 text-center">
        {isDrawing ? (
          <div className="text-yellow-400 font-bold text-lg animate-bounce">
            🎰 Spinning the wheel...
          </div>
        ) : winners.length > 0 ? (
          <div className="text-green-400 font-bold text-lg">
            🎉 Draw Complete!
          </div>
        ) : (
          <div className="text-white/60">
            {players.length > 0 ? 'Ready to draw!' : 'Add players to get started'}
          </div>
        )}
      </div>
    </div>
  )
}