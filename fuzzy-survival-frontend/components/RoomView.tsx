"use client";

interface RoomViewProps {
  currentRoom: number;
  position: number;
}

export function RoomView({ currentRoom, position }: RoomViewProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 shadow-xl shadow-purple-500/10 transform transition-all hover:scale-[1.02]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
          <span className="text-2xl">🏰</span>
        </div>
        <h3 className="text-xl font-bold text-white">Current Location</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
          <span className="text-gray-400 font-medium">Room:</span>
          <span className="text-2xl font-bold text-purple-400 font-mono">#{currentRoom}</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
          <span className="text-gray-400 font-medium">Position:</span>
          <span className="text-2xl font-bold text-purple-400 font-mono">{position}</span>
        </div>
        <div className="mt-6 p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg border border-purple-500/20">
          <p className="text-sm text-gray-400 leading-relaxed italic">
            You are in a dark dungeon. The air is thick with an unknown presence.
            Your cursed condition makes it impossible to see your true health.
          </p>
        </div>
      </div>
    </div>
  );
}
