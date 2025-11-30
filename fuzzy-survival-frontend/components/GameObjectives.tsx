"use client";

interface GameObjectivesProps {
  maxDepthReached: number;
  roomsExplored: number;
  targetDepth: number;
  targetRooms: number;
}

export function GameObjectives({
  maxDepthReached,
  roomsExplored,
  targetDepth,
  targetRooms,
}: GameObjectivesProps) {
  const depthProgress = Math.min(100, (maxDepthReached / targetDepth) * 100);
  const roomsProgress = Math.min(100, (roomsExplored / targetRooms) * 100);

  return (
    <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 shadow-xl shadow-purple-500/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
          <span className="text-2xl">🎯</span>
        </div>
        <h3 className="text-xl font-bold text-white">Objectives</h3>
      </div>
      
      <div className="space-y-6">
        {/* Depth Objective */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <span className="text-lg">⬇️</span>
              Reach Depth {targetDepth}
            </span>
            <span className="text-sm font-bold text-purple-400 font-mono px-3 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
              {maxDepthReached} / {targetDepth}
            </span>
          </div>
          <div className="relative w-full bg-gray-800/50 rounded-full h-3 overflow-hidden border border-purple-500/20">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-full transition-all duration-500 ease-out shadow-lg shadow-purple-500/50"
              style={{ width: `${depthProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Rooms Objective */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <span className="text-lg">🚪</span>
              Explore {targetRooms} Rooms
            </span>
            <span className="text-sm font-bold text-purple-400 font-mono px-3 py-1 bg-purple-500/10 rounded-lg border border-purple-500/20">
              {roomsExplored} / {targetRooms}
            </span>
          </div>
          <div className="relative w-full bg-gray-800/50 rounded-full h-3 overflow-hidden border border-purple-500/20">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-full transition-all duration-500 ease-out shadow-lg shadow-purple-500/50"
              style={{ width: `${roomsProgress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {/* Victory Hint */}
        {(depthProgress >= 100 || roomsProgress >= 100) && (
          <div className="mt-6 p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl animate-pulse">
            <p className="text-green-300 text-sm text-center font-semibold flex items-center justify-center gap-2">
              <span className="text-xl">🎉</span>
              Victory condition met! You have won!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
