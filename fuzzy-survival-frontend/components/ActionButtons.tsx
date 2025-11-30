"use client";

interface ActionButtonsProps {
  onMove: (direction: 0 | 1 | 2 | 3) => void;
  onAttack: () => void;
  onDefend: () => void;
  onUsePotion: () => void;
  isLoading: boolean;
  isInitialized: boolean;
  potionCount?: number;
}

export function ActionButtons({
  onMove,
  onAttack,
  onDefend,
  onUsePotion,
  isLoading,
  isInitialized,
  potionCount,
}: ActionButtonsProps) {
  if (!isInitialized) {
    return (
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 shadow-xl shadow-purple-500/10">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-center font-medium">Initializing game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Movement Section */}
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 shadow-xl shadow-purple-500/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
            <span className="text-2xl">🚶</span>
          </div>
          <h3 className="text-xl font-bold text-white">Movement</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
          <div></div>
          <button
            onClick={() => onMove(0)}
            disabled={isLoading}
            className="group px-6 py-4 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:scale-110 disabled:transform-none font-semibold"
          >
            <span className="text-2xl block">↑</span>
            <span className="text-xs">Up</span>
          </button>
          <div></div>
          <button
            onClick={() => onMove(2)}
            disabled={isLoading}
            className="group px-6 py-4 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:scale-110 disabled:transform-none font-semibold"
          >
            <span className="text-2xl block">←</span>
            <span className="text-xs">Left</span>
          </button>
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"></div>
          </div>
          <button
            onClick={() => onMove(3)}
            disabled={isLoading}
            className="group px-6 py-4 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:scale-110 disabled:transform-none font-semibold"
          >
            <span className="text-2xl block">→</span>
            <span className="text-xs">Right</span>
          </button>
          <div></div>
          <button
            onClick={() => onMove(1)}
            disabled={isLoading}
            className="group px-6 py-4 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:scale-110 disabled:transform-none font-semibold"
          >
            <span className="text-2xl block">↓</span>
            <span className="text-xs">Down</span>
          </button>
          <div></div>
        </div>
      </div>

      {/* Combat Section */}
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30 shadow-xl shadow-red-500/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/20">
            <span className="text-2xl">⚔️</span>
          </div>
          <h3 className="text-xl font-bold text-white">Combat</h3>
        </div>
        <div className="flex flex-col space-y-3">
          <button
            onClick={onAttack}
            disabled={isLoading}
            className="group relative px-8 py-4 bg-gradient-to-r from-red-600 via-red-600 to-orange-600 text-white rounded-xl hover:from-red-500 hover:via-red-500 hover:to-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transform hover:scale-105 disabled:transform-none font-bold text-lg overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-2xl">⚔️</span>
              Attack
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
          <button
            onClick={onDefend}
            disabled={isLoading}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 text-white rounded-xl hover:from-blue-500 hover:via-cyan-500 hover:to-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:scale-105 disabled:transform-none font-bold text-lg overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <span className="text-2xl">🛡️</span>
              Defend
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 shadow-xl shadow-green-500/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/20">
            <span className="text-2xl">🧪</span>
          </div>
          <h3 className="text-xl font-bold text-white">Items</h3>
        </div>
        <button
          onClick={onUsePotion}
          disabled={isLoading || potionCount === 0}
          className="group relative w-full px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 text-white rounded-xl hover:from-green-500 hover:via-emerald-500 hover:to-green-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transform hover:scale-105 disabled:transform-none font-bold text-lg overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span className="text-2xl">🧪</span>
            Use Potion
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
        <div className="mt-4 px-4 py-3 bg-gray-800/50 rounded-lg border border-green-500/20">
          <p className="text-center text-sm">
            <span className="text-gray-400">Potions: </span>
            <span className={`text-xl font-bold ${potionCount !== undefined ? (potionCount > 0 ? 'text-green-400' : 'text-red-400') : 'text-gray-500'}`}>
              {potionCount !== undefined ? potionCount : "???"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
