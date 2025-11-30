"use client";

import { GameFeedback } from "@/hooks/useFuzzySurvival";

interface FuzzyFeedbackProps {
  feedback: GameFeedback | undefined;
}

export function FuzzyFeedback({ feedback }: FuzzyFeedbackProps) {
  if (!feedback) {
    return (
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 shadow-xl shadow-purple-500/10 min-h-[220px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center border border-purple-500/20">
            <svg className="w-8 h-8 text-gray-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-400 text-center font-medium">
            No feedback yet. Start exploring the dungeon...
          </p>
        </div>
      </div>
    );
  }

  const getFeedbackConfig = (index: number) => {
    const configs = [
      { color: "from-green-500 to-emerald-500", bg: "from-green-500/20 to-emerald-500/20", icon: "💚", glow: "shadow-green-500/30" },
      { color: "from-yellow-500 to-amber-500", bg: "from-yellow-500/20 to-amber-500/20", icon: "💛", glow: "shadow-yellow-500/30" },
      { color: "from-orange-500 to-red-500", bg: "from-orange-500/20 to-red-500/20", icon: "🧡", glow: "shadow-orange-500/30" },
      { color: "from-red-500 to-red-600", bg: "from-red-500/20 to-red-600/20", icon: "❤️", glow: "shadow-red-500/30" },
      { color: "from-red-600 to-red-700", bg: "from-red-600/20 to-red-700/20", icon: "💔", glow: "shadow-red-600/40" },
    ];
    return configs[Math.min(index, configs.length - 1)];
  };

  const config = getFeedbackConfig(feedback.feedbackIndex);

  return (
    <div className={`bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30 shadow-xl ${config.glow} min-h-[220px] transform transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.bg} flex items-center justify-center text-2xl border border-purple-500/20`}>
          {config.icon}
        </div>
        <h3 className="text-xl font-bold text-white">Your Condition</h3>
      </div>
      <div className="relative">
        <p className={`text-2xl font-semibold bg-gradient-to-r ${config.color} bg-clip-text text-transparent leading-relaxed animate-fade-in`}>
          {feedback.feedbackText}
        </p>
        <div className={`absolute inset-0 bg-gradient-to-r ${config.bg} blur-xl opacity-50 -z-10`}></div>
      </div>
    </div>
  );
}
