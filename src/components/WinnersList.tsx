'use client'

interface WinnersListProps {
  winners: string[]
  isDrawing?: boolean
}

const CONFETTI = ['#fbbf24', '#f97316', '#10b981', '#60a5fa', '#f472b6', '#a78bfa']

export default function WinnersList({ winners, isDrawing = false }: WinnersListProps) {
  const complete = winners.length > 0 && !isDrawing

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.07] backdrop-blur-md p-6 border border-white/15 shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
      {/* Confetti burst when a draw finishes */}
      {complete && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-0 block w-2 h-2 rounded-[2px]"
              style={{
                left: `${(i * 4.2 + 3) % 100}%`,
                background: CONFETTI[i % CONFETTI.length],
                animation: `confettiFall ${1.6 + (i % 5) * 0.25}s ease-in ${(i % 7) * 0.12}s both`,
              }}
            />
          ))}
        </div>
      )}

      <h2 className="relative text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span aria-hidden>🏆</span> Winners
      </h2>

      <div className="relative space-y-3" aria-live="polite">
        {winners.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-2 opacity-60">🎯</div>
            <p className="text-white/50 italic">
              No winners yet.
              <br />
              Start a draw to see results!
            </p>
          </div>
        ) : (
          winners.map((winner, index) => (
            <div
              key={`${winner}-${index}`}
              className="flex items-center justify-between gap-3 bg-gradient-to-r from-amber-400/15 to-orange-500/15 border border-amber-400/30 rounded-xl px-4 py-3.5 transition-all duration-300 hover:scale-[1.02]"
              style={{ animation: `fadeInScale 0.45s ease-out ${index * 0.08}s both` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-2xl shrink-0">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold text-lg truncate">{winner}</div>
                  <div className="text-amber-300 text-xs">Position #{index + 1}</div>
                </div>
              </div>
              <div className="text-emerald-300 text-sm font-semibold shrink-0">Winner!</div>
            </div>
          ))
        )}
      </div>

      {complete && (
        <div className="relative mt-6 text-center">
          <p className="text-white/70 text-sm mb-3">
            Congratulations to all {winners.length} winner
            {winners.length !== 1 ? 's' : ''}! 🎊
          </p>
          <div className="inline-block bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 px-5 py-2 rounded-lg font-extrabold">
            🌟 Draw Complete 🌟
          </div>
        </div>
      )}
    </div>
  )
}
