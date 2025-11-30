"use client";

import { useEthersSigner } from "@/hooks/wallet/useEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useGameHistory } from "@/hooks/useGameHistory";
import { Navigation } from "@/components/Navigation";

export default function HistoryPage() {
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

  const { gameRecords, gameCount, isLoading, error, decryptingIndex, loadAllGameRecords, decryptGameRecord } = useGameHistory({
    instance,
    fhevmDecryptionSignatureStorage: storage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const formatDate = (timestamp: number) => {
    if (timestamp === 0) return "Unknown";
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  if (!provider || !chainId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-950 to-black">
        <Navigation />
        <div className="min-h-screen flex items-center justify-center p-4 pt-20">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center border border-purple-500/20">
              <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-xl text-gray-300 font-semibold">Please connect your wallet</p>
            <p className="text-gray-500 text-sm">Connect your wallet to view your game history</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-950 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Navigation />
      <div className="max-w-7xl mx-auto p-6 pt-24 relative z-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
              <span className="text-3xl">📜</span>
            </div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Game History
            </h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            View your encrypted game records. All sensitive data (HP, Potions) is decrypted on-demand.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-5 bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-500/50 rounded-xl shadow-lg shadow-red-500/10">
            <p className="text-red-300 font-semibold flex items-center gap-2">
              <span className="text-xl">⚠️</span>
              {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && gameCount === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-xl text-gray-400 font-semibold">Loading game records...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && gameCount === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-800/50 rounded-full flex items-center justify-center border border-purple-500/20">
              <span className="text-5xl">📭</span>
            </div>
            <p className="text-2xl text-gray-400 mb-3 font-semibold">No game records found</p>
            <p className="text-gray-500">Complete a game to see your history here.</p>
          </div>
        )}

        {/* Game Records */}
        {!isLoading && gameCount > 0 && (
          <div className="space-y-6">
            {/* Total Games Counter */}
            <div className="flex items-center justify-between mb-6">
              <div className="px-6 py-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                <p className="text-lg text-gray-300">
                  Total Games: <span className="text-purple-400 font-bold font-mono text-xl">{gameCount}</span>
                </p>
              </div>
            </div>

            {/* Records List */}
            {gameRecords.map((record) => (
              <div
                key={record.gameIndex}
                className="bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-purple-500/30 shadow-xl shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300 transform hover:scale-[1.01]"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                      Game #{record.gameIndex + 1}
                    </h3>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <span className="text-lg">🕐</span>
                      {formatDate(record.timestamp)}
                    </p>
                  </div>
                  {(record.finalHP === null || record.finalPotionCount === null) && (
                    <button
                      onClick={() => decryptGameRecord(record.gameIndex)}
                      disabled={decryptingIndex === record.gameIndex || isLoading}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transform hover:scale-105 disabled:transform-none text-sm"
                    >
                      {decryptingIndex === record.gameIndex ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Decrypting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span>🔓</span>
                          Decrypt All
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Final HP */}
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-5 border border-red-500/20 shadow-lg">
                    <p className="text-sm text-gray-400 mb-2 font-medium">Final HP</p>
                    {record.finalHP === null ? (
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-3xl font-bold text-gray-500">🔒</p>
                        <p className="text-sm text-gray-500">Encrypted</p>
                        {record.finalPotionCount === null && (
                          <button
                            onClick={() => decryptGameRecord(record.gameIndex)}
                            disabled={decryptingIndex === record.gameIndex || isLoading}
                            className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                          >
                            Decrypt
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-red-400">{record.finalHP}</p>
                    )}
                  </div>

                  {/* Final Potions */}
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-5 border border-green-500/20 shadow-lg">
                    <p className="text-sm text-gray-400 mb-2 font-medium">Final Potions</p>
                    {record.finalPotionCount === null ? (
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-3xl font-bold text-gray-500">🔒</p>
                        <p className="text-sm text-gray-500">Encrypted</p>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-green-400">{record.finalPotionCount}</p>
                    )}
                  </div>

                  {/* Rooms Explored */}
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-5 border border-blue-500/20 shadow-lg">
                    <p className="text-sm text-gray-400 mb-2 font-medium">Rooms Explored</p>
                    <p className="text-3xl font-bold text-blue-400">{record.roomsExplored}</p>
                  </div>

                  {/* Final Position */}
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl p-5 border border-yellow-500/20 shadow-lg">
                    <p className="text-sm text-gray-400 mb-2 font-medium">Final Position</p>
                    <p className="text-3xl font-bold text-yellow-400">{record.finalPosition}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        {gameCount > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={loadAllGameRecords}
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transform hover:scale-105 disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>🔄</span>
                  Refresh History
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
