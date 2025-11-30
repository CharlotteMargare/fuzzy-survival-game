"use client";

import { Navigation } from "@/components/Navigation";
import { GameBoard } from "@/components/GameBoard";

export default function GamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-950 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      <Navigation />
      <main className="pt-20 relative z-10">
        <GameBoard />
      </main>
    </div>
  );
}
