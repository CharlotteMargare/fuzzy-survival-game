"use client";

import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/wallet/useWallet";
import { useEthersSigner } from "@/hooks/wallet/useEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFuzzySurvival } from "@/hooks/useFuzzySurvival";
import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { ethers } from "ethers";
import { FuzzySurvivalABI } from "@/abi/FuzzySurvivalABI";
import { FuzzySurvivalAddresses } from "@/abi/FuzzySurvivalAddresses";

export default function Home() {
  const router = useRouter();
  const { isConnected, connect, accounts } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);

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
    enabled: Boolean(provider && chainId && isConnected),
    initialMockChains,
  });

  const { storage } = useInMemoryStorage();

  const { initializeGame, resetPlayer, isInitialized } = useFuzzySurvival({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    autoInitialize: false, // Disable auto-initialize on welcome page
  });

  const handleEnterDungeon = async () => {
    if (!isConnected) {
      setIsConnecting(true);
      try {
        await connect();
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      } finally {
        setIsConnecting(false);
      }
    } else {
      router.push("/game");
    }
  };

  const handleStartNewGame = async () => {
    if (!isConnected) {
      setIsConnecting(true);
      try {
        await connect();
        // After connecting, wait a bit for the wallet to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        setIsConnecting(false);
        return;
      } finally {
        setIsConnecting(false);
      }
    }

    if (!instance || !ethersSigner || !chainId || !ethersReadonlyProvider) {
      console.error("Cannot start new game: missing dependencies");
      return;
    }

    setIsStartingGame(true);
    try {
      const contractAddresses = FuzzySurvivalAddresses[chainId.toString() as keyof typeof FuzzySurvivalAddresses];
      if (!contractAddresses) {
        throw new Error("Contract not deployed on this network");
      }

      const contract = new ethers.Contract(
        contractAddresses.address,
        FuzzySurvivalABI.abi,
        ethersReadonlyProvider
      ) as any;

      // Check if player exists
      const hasPlayer = await contract?.hasPlayer?.(ethersSigner.address);

      if (hasPlayer) {
        // Player exists, reset the game
        await resetPlayer();
      } else {
        // Player doesn't exist, initialize new game
        await initializeGame();
      }
      // Navigate to game page after starting
      router.push("/game");
    } catch (error) {
      console.error("Failed to start new game:", error);
      alert(`Failed to start new game: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsStartingGame(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-950 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Navigation />
      <main className="min-h-screen flex items-center justify-center p-4 pt-20 relative z-10">
        <div className="max-w-5xl w-full text-center space-y-10">
          {/* Hero Section */}
          <div className="space-y-6 animate-fade-in">
            <div className="relative">
              <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 drop-shadow-2xl tracking-tight">
                The Cursed Hero
              </h1>
              <div className="absolute inset-0 text-7xl md:text-9xl font-black text-purple-500/20 blur-2xl -z-10">
                The Cursed Hero
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-red-400 drop-shadow-lg tracking-wide">
              Fuzzy Survival
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mt-8 max-w-3xl mx-auto leading-relaxed">
              Your health is hidden. Trust your instincts.
            </p>
          </div>

          {/* Game Description Card */}
          <div className="mt-16 space-y-8">
            <div className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl p-8 md:p-10 border border-purple-500/30 shadow-2xl shadow-purple-500/10 max-w-3xl mx-auto transform transition-all hover:scale-[1.02] hover:shadow-purple-500/20">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
                <h3 className="text-3xl font-bold text-white mx-4">About the Game</h3>
                <div className="w-16 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
              </div>
              <div className="space-y-4 text-gray-300 text-left leading-relaxed">
                <p className="text-lg">
                  You are exploring a <span className="text-purple-400 font-semibold">cursed dungeon</span>, afflicted by a strange curse that creates hallucinations and hides your true physical condition.
                </p>
                <p className="text-lg">
                  Your <span className="text-red-400 font-semibold">HP is encrypted</span> and invisible. You can only judge your condition through vague feedback from your body&apos;s reactions.
                </p>
                <p className="text-lg">
                  <span className="text-green-400 font-semibold">Potions are limited</span>. You must decide whether to use them now or risk another turn, all while uncertain of your exact health.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
              <button
                onClick={handleStartNewGame}
                disabled={isConnecting || isStartingGame}
                className="group relative px-10 py-5 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 text-white text-xl font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isStartingGame ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Starting...
                    </>
                  ) : isConnecting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">🎮</span>
                      Start New Game
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              {isConnected && (
                <button
                  onClick={handleEnterDungeon}
                  disabled={isConnecting || isStartingGame}
                  className="group relative px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white text-xl font-bold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-2xl">⚔️</span>
                    Continue Game
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              )}
            </div>

            {!isConnected && (
              <p className="text-gray-400 text-sm mt-6 animate-pulse">
                Connect your wallet to start playing
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-20 pt-8 border-t border-purple-500/20">
            <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Powered by <span className="text-purple-400 font-semibold">FHEVM</span> - Your data is encrypted on-chain
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
