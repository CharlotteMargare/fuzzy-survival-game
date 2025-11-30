"use client";

import { useEthersSigner } from "@/hooks/wallet/useEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFuzzySurvival } from "@/hooks/useFuzzySurvival";
import { FuzzyFeedback } from "./FuzzyFeedback";
import { ActionButtons } from "./ActionButtons";
import { RoomView } from "./RoomView";
import { GameOver } from "./GameOver";
import { Victory } from "./Victory";
import { GameObjectives } from "./GameObjectives";

export function GameBoard() {
  const {
    provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useEthersSigner();

  const { instance } = useFhevm({
    provider,
    chainId,
    enabled: Boolean(provider && chainId),
    initialMockChains,
  });

  const { storage } = useInMemoryStorage();

  const {
    gameState,
    lastFeedback,
    isLoading,
    error,
    isInitialized,
    isGameOver,
    hasWon,
    resetPlayer,
    move,
    attack,
    defend,
    usePotion,
  } = useFuzzySurvival({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  if (!provider || !chainId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center border border-purple-500/20">
            <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-xl text-gray-300 font-semibold">Please connect your wallet</p>
          <p className="text-gray-500 text-sm">Connect your wallet to start playing</p>
        </div>
      </div>
    );
  }

  // Show victory screen
  if (hasWon && gameState) {
    return (
      <Victory
        maxDepth={gameState.maxDepthReached ?? 0}
        roomsExplored={gameState.roomsExplored ?? 0}
        onRestart={async () => {
          // Reset player to initial state
          await resetPlayer();
        }}
      />
    );
  }

  // Show game over screen
  if (isGameOver) {
    console.log(`[GameBoard] Rendering GameOver screen. isGameOver=${isGameOver}, gameState=`, gameState);
    return (
      <GameOver
        position={gameState?.position ?? 0}
        currentRoom={gameState?.currentRoom ?? 0}
        onRestart={async () => {
          // Reset player to initial state
          await resetPlayer();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500/50 rounded-xl shadow-lg shadow-red-500/10">
            <p className="text-red-300 font-semibold flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              {error}
            </p>
          </div>
        )}

        {/* Loading Message */}
        {isLoading && (
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/50 rounded-xl shadow-lg shadow-blue-500/10">
            <p className="text-blue-300 font-semibold flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </p>
          </div>
        )}

        {/* Main Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Status */}
          <div className="lg:col-span-1 space-y-6">
            <FuzzyFeedback feedback={lastFeedback} />
            {gameState && (
              <>
                <GameObjectives
                  maxDepthReached={gameState.maxDepthReached ?? 0}
                  roomsExplored={gameState.roomsExplored ?? 0}
                  targetDepth={10}
                  targetRooms={20}
                />
                <RoomView
                  currentRoom={gameState.currentRoom}
                  position={gameState.position}
                />
              </>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-2">
            <ActionButtons
              onMove={move}
              onAttack={attack}
              onDefend={defend}
              onUsePotion={usePotion}
              isLoading={isLoading}
              isInitialized={isInitialized}
              potionCount={gameState?.potionCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
