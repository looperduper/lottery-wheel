'use client'

interface WinnersListProps {
  winners: string[]
}

export default function WinnersList({ winners }: WinnersListProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
        🎯 Drawed Players
      </h2>
      
      <div className="space-y-3">
        {winners.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎯</div>
            <p className="text-white/60 italic">
              No drawed players yet.<br />
              Start a draw to see results!
            </p>
          </div>
        ) : (
          winners.map((winner, index) => (
            <div
              key={`${winner}-${index}`}
              className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 rounded-lg p-4 transform transition-all duration-300 hover:scale-105"
              style={{
                animation: `fadeInScale 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏆'}
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">
                      {winner}
                    </div>
                    <div className="text-yellow-400 text-sm">
                      Position #{index + 1}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white/80 text-sm">
                    🎉 Drawed!
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {winners.length > 0 && (
        <div className="mt-6 text-center">
          <div className="text-white/80 text-sm mb-2">
            Congratulations to all {winners.length} drawed player{winners.length !== 1 ? 's' : ''}! 🎊
          </div>
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold inline-block">
            🌟 Draw Complete 🌟
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}