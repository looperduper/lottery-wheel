'use client'

import { SPIN_EASING, LotteryStatus } from '@/lib/lotteryTypes'

interface LotteryWheelProps {
  players: string[]
  winners: string[]
  /** Absolute rotation in degrees, driven by the server so all clients match. */
  rotation: number
  /** Whether to animate to `rotation` (true) or jump to it (false). */
  spinning: boolean
  spinDurationMs: number
  status: LotteryStatus
}

export default function LotteryWheel({
  players,
  winners,
  rotation,
  spinning,
  spinDurationMs,
  status,
}: LotteryWheelProps) {
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
      const angle =
        (index / players.length) * 2 * Math.PI - Math.PI / 2 + Math.PI / players.length
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
  const isSpinning = status === 'spinning' || spinning

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Glow ring behind the wheel */}
        {players.length > 0 && (
          <div
            className={`absolute -inset-3 rounded-full bg-amber-400/25 blur-2xl ${
              isSpinning ? 'animate-glow' : 'opacity-40'
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
                  ? `transform ${spinDurationMs}ms ${SPIN_EASING}`
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
        {isSpinning ? (
          <div className="text-amber-300 font-bold text-lg">🎰 Spinning the wheel…</div>
        ) : winners.length > 0 ? (
          <div className="text-emerald-400 font-bold text-lg">
            {status === 'done' ? '🎉 Draw complete!' : '🎉 Winner drawn!'}
          </div>
        ) : (
          <div className="text-white/50">
            {players.length > 0 ? 'Ready to draw!' : 'Add players to get started'}
          </div>
        )}
      </div>
    </div>
  )
}
