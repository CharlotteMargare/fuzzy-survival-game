"use client";

import { useRouter, usePathname } from "next/navigation";
import { useWallet } from "@/hooks/wallet/useWallet";
import { useEthersSigner } from "@/hooks/wallet/useEthersSigner";

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, accounts, connect, disconnect, chainId } = useWallet();
  const { ethersSigner } = useEthersSigner();

  const getChainName = (chainId?: number): string => {
    if (!chainId) return "Unknown";
    if (chainId === 31337) return "Localhost";
    if (chainId === 11155111) return "Sepolia";
    return `Chain ${chainId}`;
  };

  const formatAddress = (address?: string): string => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDisconnect = () => {
    disconnect();
    if (pathname !== "/") {
      router.push("/");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-xl border-b border-purple-500/30 shadow-lg shadow-purple-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push("/")}
              className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-300 hover:to-pink-300 transition-all duration-300 transform hover:scale-105"
            >
              The Cursed Hero
            </button>
            {pathname === "/game" && (
              <span className="hidden sm:inline text-sm text-gray-400 font-medium px-3 py-1 bg-gray-800/50 rounded-lg border border-purple-500/20">
                Fuzzy Survival
              </span>
            )}
            {isConnected && (
              <div className="hidden md:flex items-center space-x-3">
                <button
                  onClick={() => router.push("/game")}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    pathname === "/game"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                      : "text-gray-300 hover:text-purple-400 hover:bg-gray-800/50"
                  }`}
                >
                  Game
                </button>
                <button
                  onClick={() => router.push("/history")}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                    pathname === "/history"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                      : "text-gray-300 hover:text-purple-400 hover:bg-gray-800/50"
                  }`}
                >
                  History
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isConnected && accounts && accounts.length > 0 && (
              <>
                <div className="hidden lg:flex items-center space-x-4 text-sm">
                  <div className="px-3 py-1.5 bg-gray-800/50 rounded-lg border border-purple-500/20">
                    <span className="text-gray-400">Network: </span>
                    <span className="text-purple-400 font-semibold">{getChainName(chainId)}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-gray-800/50 rounded-lg border border-purple-500/20">
                    <span className="text-gray-400">Address: </span>
                    <span className="text-purple-400 font-mono font-semibold">
                      {formatAddress(accounts[0])}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-all duration-300 text-sm font-semibold shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transform hover:scale-105"
                >
                  Disconnect
                </button>
              </>
            )}
            {!isConnected && (
              <button
                onClick={() => connect()}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-300 text-sm font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40 transform hover:scale-105"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
