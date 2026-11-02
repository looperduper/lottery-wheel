'use client'

import { useEffect, useState } from 'react'

// How long one spin takes. Shared with the page so reveal timing matches the
// CSS transition below.
export const SPIN_MS = 2600

interface LotteryWheelProps {
  players: string[]
  isDrawing: boolean
  winners: string[]
  /** The player the wheel should rotate to point at, or null when idle. */
  spinTarget: string | null
}

export default function LotteryWheel({
  players,
  isDrawing,
  winners,
  spinTarget,
}: LotteryWheelProps) {
  // Rotation only ever increases, so the wheel never snaps back to 0.
  const [rotation, setRotation] = useState<number>(0)
  const [spinning, setSpinning] = useState<boolean>(false)

  useEffect(() => {
    if (!spinTarget) return
    const n = players.length
    const idx = players.indexOf(spinTarget)
    if (n === 0 || idx < 0) return

    const segment = 360 / n
    // The pointer sits at the top (0°). Segment `idx` is centered at
    // (idx + 0.5) * segment measured clockwise from the top, so we must rotate
    // the wheel by the complement to bring that center under the pointer.
    const desiredMod = (360 - (((idx + 0.5) * segment) % 360)) % 360
    // First spin is the most dramatic; later ones are a touch quicker.
    const extraTurns = winners.length === 0 ? 5 : 3

    setRotation(prev => {
      const currentMod = ((prev % 360) + 360) % 360
      const delta = ((desiredMod - currentMod) % 360 + 360) % 360
      return prev + extraTurns * 360 + delta
    })
    setSpinning(true)

    const stop = setTimeout(() => setSpinning(false), SPIN_MS)
    return () => clearTimeout(stop)
    // Re-run only when a new target is set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinTarget])

  const wheelSize = 300
  const centerX = wheelSize / 2
  const centerY = wheelSize / 2
  const radius = wheelSize / 2 - 30

  const generateUniqueColor = (index: number, total: number) => {
    const hue = (index * 360) / total
    const saturation = 70 + (index % 3) * 10
    const lightness = 45 + (index % 4) * 8
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  const getPlayerPositions = () =>
    players.map((player, index) => {
      const angle = (index / players.length) * 2 * Math.PI - Math.PI / 2 + Math.PI / players.length
      const x = centerX + Math.cos(angle) * radius * 0.68
      const y = centerY + Math.sin(angle) * radius * 0.68
      return { player, x, y, angle: angle * (180 / Math.PI), index }
    })

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
        'Z',
      ].join(' ')

      return { pathData, index, player, color: generateUniqueColor(index, players.length) }
    })
  }

  const playerPositions = getPlayerPositions()
  const wheelSegments = getWheelSegments()

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Glow ring behind the wheel */}
        {players.length > 0 && (
          <div
            className={`absolute -inset-3 rounded-full bg-amber-400/25 blur-2xl ${
              isDrawing ? 'animate-glow' : 'opacity-40'
            }`}
            aria-hidden
          />
        )}

        {players.length === 0 ? (
          <div className="w-72 h-72 rounded-full bg-white/5 flex items-center justify-center border-8 border-white/10">
            <div className="text-center text-white/50">
              <div className="text-4xl mb-2">🎰</div>
              <div className="text-sm">Add players to start</div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <svg
              width={wheelSize}
              height={wheelSize}
              className="relative drop-shadow-2xl"
              role="img"
              aria-label={`Lottery wheel with ${players.length} players`}
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`
                  : 'none',
              }}
            >
              {/* Outer rim */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radius + 6}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="10"
              />

              {/* Segments */}
              {wheelSegments.map(({ pathData, index, player, color }) => (
                <path
                  key={`segment-${index}`}
                  d={pathData}
                  fill={winners.includes(player) ? '#10B981' : color}
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="2"
                  className="transition-[fill] duration-300"
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
                  className="pointer-events-none select-none [paint-order:stroke]"
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth="0.6"
                >
                  {player.length > 9 ? player.substring(0, 9) + '…' : player}
                </text>
              ))}

              {/* Center hub */}
              <circle cx={centerX} cy={centerY} r="26" fill="#1F2937" stroke="#ffffff" strokeWidth="3" />
              <text
                x={centerX}
                y={centerY}
                fill="white"
                fontSize="18"
                textAnchor="middle"
                dominantBaseline="central"
              >
                🎰
              </text>
            </svg>

            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
              <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[28px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </div>
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="mt-5 text-center min-h-[28px]">
        {isDrawing ? (
          <div className="text-amber-300 font-bold text-lg">🎰 Spinning the wheel…</div>
        ) : winners.length > 0 ? (
          <div className="text-emerald-400 font-bold text-lg">🎉 Draw complete!</div>
        ) : (
          <div className="text-white/50">
            {players.length > 0 ? 'Ready to draw!' : 'Add players to get started'}
          </div>
        )}
      </div>
    </div>
  )
}
