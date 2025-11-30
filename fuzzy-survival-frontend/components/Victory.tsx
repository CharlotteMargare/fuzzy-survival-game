"use client";

import { useRouter } from "next/navigation";

interface VictoryProps {
  maxDepth: number;
  roomsExplored: number;
  onRestart: () => Promise<void>;
}

export function Victory({ maxDepth, roomsExplored, onRestart }: VictoryProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-gray-950 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-2xl w-full bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl rounded-3xl p-10 md:p-12 border-2 border-green-500/50 shadow-2xl shadow-green-500/20 relative z-10">
        <div className="text-center space-y-8">
          {/* Title */}
          <div className="relative">
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 mb-4 drop-shadow-2xl animate-pulse">
              VICTORY!
            </h1>
            <div className="absolute inset-0 text-6xl md:text-7xl font-black text-green-500/20 blur-2xl -z-10">
              VICTORY!
            </div>
          </div>
          
          <div className="text-3xl text-gray-300 mb-10 font-semibold">
            You have survived the cursed dungeon!
          </div>

          {/* Statistics Card */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-8 mb-8 border border-green-500/30 shadow-xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
              <h2 className="text-2xl font-bold text-white mx-4">Final Statistics</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
            </div>
            <div className="space-y-4 text-gray-300">
              <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg border border-green-500/20">
                <span className="text-lg font-medium">Maximum Depth Reached:</span>
                <span className="text-2xl font-bold text-green-400 font-mono">{maxDepth} levels</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-900/50 rounded-lg border border-green-500/20">
                <span className="text-lg font-medium">Rooms Explored:</span>
                <span className="text-2xl font-bold text-green-400 font-mono">{roomsExplored}</span>
              </div>
            </div>
          </div>

          {/* Victory Message */}
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 mb-8 border border-green-500/30 shadow-lg">
            <p className="text-green-300 text-lg leading-relaxed flex items-center justify-center gap-2">
              <span className="text-2xl">✨</span>
              You have proven yourself worthy! The curse has been lifted, and you emerge victorious from the depths.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onRestart}
              className="group relative px-10 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white rounded-xl hover:from-green-500 hover:via-emerald-500 hover:to-green-500 transition-all duration-300 font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transform hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span className="text-xl">🎮</span>
                Play Again
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={() => router.push("/")}
              className="group relative px-10 py-4 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-bold text-lg shadow-lg shadow-gray-500/20 hover:shadow-gray-500/30 transform hover:scale-105 overflow-hidden border border-gray-600/50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <span className="text-xl">🏠</span>
                Return to Home
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
