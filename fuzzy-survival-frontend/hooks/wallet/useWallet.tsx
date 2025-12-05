"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Eip1193Provider, ethers } from "ethers";
import { useEip6963 } from "./useEip6963";

interface ProviderConnectInfo {
  readonly chainId: string;
}

interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

type ConnectListenerFn = (connectInfo: ProviderConnectInfo) => void;
type DisconnectListenerFn = (error: ProviderRpcError) => void;
type ChainChangedListenerFn = (chainId: string) => void;
type AccountsChangedListenerFn = (accounts: string[]) => void;

type Eip1193EventMap = {
  connect: ConnectListenerFn;
  chainChanged: ChainChangedListenerFn;
  accountsChanged: AccountsChangedListenerFn;
  disconnect: DisconnectListenerFn;
};

type Eip1193EventFn = <E extends keyof Eip1193EventMap>(
  event: E,
  fn: Eip1193EventMap[E]
) => void;

interface Eip1193ProviderWithEvent extends ethers.Eip1193Provider {
  on?: Eip1193EventFn;
  off?: Eip1193EventFn;
  addListener?: Eip1193EventFn;
  removeListener?: Eip1193EventFn;
}

const WALLET_STORAGE_KEY = "wallet";

interface WalletStorage {
  lastConnectorId?: string;
  lastAccounts?: string[];
  lastChainId?: number;
  connected?: boolean;
}

function loadWalletStorage(): WalletStorage {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

function saveWalletStorage(storage: WalletStorage) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(storage));
  } catch {
    // Ignore storage errors
  }
}

export interface UseWalletState {
  provider: Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  error: Error | undefined;
  connect: (connectorId?: string) => Promise<void>;
  disconnect: () => void;
  selectedConnectorId: string | undefined;
}

function useWalletInternal(): UseWalletState {
  const { error: eip6963Error, providers } = useEip6963();
  const [_currentProvider, _setCurrentProvider] = useState<
    Eip1193ProviderWithEvent | undefined
  >(undefined);
  const [chainId, _setChainId] = useState<number | undefined>(undefined);
  const [accounts, _setAccounts] = useState<string[] | undefined>(undefined);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | undefined>(undefined);

  const connectListenerRef = useRef<ConnectListenerFn | undefined>(undefined);
  const disconnectListenerRef = useRef<DisconnectListenerFn | undefined>(
    undefined
  );
  const chainChangedListenerRef = useRef<ChainChangedListenerFn | undefined>(
    undefined
  );
  const accountsChangedListenerRef = useRef<
    AccountsChangedListenerFn | undefined
  >(undefined);

  const walletProviderRef = useRef<Eip1193ProviderWithEvent | undefined>(
    undefined
  );

  const hasProvider = Boolean(_currentProvider);
  const hasAccounts = (accounts?.length ?? 0) > 0;
  const hasChain = typeof chainId === "number";

  const isConnected = hasProvider && hasAccounts && hasChain;

  const connect = useCallback(async (connectorId?: string) => {
    let targetProvider: Eip1193ProviderWithEvent | undefined = undefined;

    if (connectorId) {
      targetProvider = providers.find(p => p.info.uuid === connectorId)?.provider;
    } else {
      const storage = loadWalletStorage();
      if (storage.lastConnectorId) {
        targetProvider = providers.find(p => p.info.uuid === storage.lastConnectorId)?.provider;
      }
      if (!targetProvider && providers.length > 0) {
        targetProvider = providers[0].provider;
      }
    }

    if (!targetProvider) {
      return;
    }

    try {
      const accountsArray = await targetProvider.request({ method: "eth_requestAccounts" });
      if (accountsArray && Array.isArray(accountsArray) && accountsArray.length > 0) {
        const connectorIdToSave = connectorId || providers.find(p => p.provider === targetProvider)?.info.uuid;
        if (connectorIdToSave) {
          setSelectedConnectorId(connectorIdToSave);
          saveWalletStorage({
            lastConnectorId: connectorIdToSave,
            lastAccounts: accountsArray as string[],
            connected: true,
          });
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  }, [providers]);

  const disconnect = useCallback(() => {
    saveWalletStorage({
      connected: false,
    });
    _setCurrentProvider(undefined);
    _setChainId(undefined);
    _setAccounts(undefined);
    setSelectedConnectorId(undefined);
  }, []);

  useEffect(() => {
    const storage = loadWalletStorage();
    if (storage.connected && storage.lastConnectorId && !selectedConnectorId) {
      const savedProvider = providers.find(p => p.info.uuid === storage.lastConnectorId)?.provider;
      if (savedProvider) {
        setSelectedConnectorId(storage.lastConnectorId);
      }
    }
  }, [providers, selectedConnectorId]);

  useEffect(() => {
    let next: Eip1193ProviderWithEvent | undefined = undefined;
    
    if (selectedConnectorId) {
      next = providers.find(p => p.info.uuid === selectedConnectorId)?.provider;
    } else if (providers.length > 0) {
      next = providers[0].provider;
    }

    const prev = walletProviderRef.current;
    if (prev === next) {
      return;
    }

    if (prev) {
      if (connectListenerRef.current) {
        prev.off?.("connect", connectListenerRef.current);
        prev.removeListener?.("connect", connectListenerRef.current);
        connectListenerRef.current = undefined;
      }

      if (disconnectListenerRef.current) {
        prev.off?.("disconnect", disconnectListenerRef.current);
        prev.removeListener?.("disconnect", disconnectListenerRef.current);
        disconnectListenerRef.current = undefined;
      }

      if (chainChangedListenerRef.current) {
        prev.off?.("chainChanged", chainChangedListenerRef.current);
        prev.removeListener?.("chainChanged", chainChangedListenerRef.current);
        chainChangedListenerRef.current = undefined;
      }

      if (accountsChangedListenerRef.current) {
        prev.off?.("accountsChanged", accountsChangedListenerRef.current);
        prev.removeListener?.(
          "accountsChanged",
          accountsChangedListenerRef.current
        );
        accountsChangedListenerRef.current = undefined;
      }
    }

    _setCurrentProvider(undefined);
    _setChainId(undefined);
    _setAccounts(undefined);

    walletProviderRef.current = next;

    let nextConnectListener: ConnectListenerFn | undefined = undefined;
    let nextDisconnectListener: DisconnectListenerFn | undefined = undefined;
    let nextChainChangedListener: ChainChangedListenerFn | undefined =
      undefined;
    let nextAccountsChangedListener: AccountsChangedListenerFn | undefined =
      undefined;

    connectListenerRef.current = undefined;
    disconnectListenerRef.current = undefined;
    chainChangedListenerRef.current = undefined;
    accountsChangedListenerRef.current = undefined;

    if (next) {
      nextConnectListener = (connectInfo: ProviderConnectInfo) => {
        if (next !== walletProviderRef.current) {
          return;
        }
        console.log(
          `[useWallet] on('connect') chainId=${connectInfo.chainId}`
        );
        _setCurrentProvider(next);
        _setChainId(Number.parseInt(connectInfo.chainId, 16));
        saveWalletStorage({
          lastChainId: Number.parseInt(connectInfo.chainId, 16),
          connected: true,
        });
      };
      connectListenerRef.current = nextConnectListener;

      nextDisconnectListener = (error: ProviderRpcError) => {
        if (next !== walletProviderRef.current) {
          return;
        }
        console.log(`[useWallet] on('disconnect') error code=${error.code}`);
        _setCurrentProvider(undefined);
        _setChainId(undefined);
        _setAccounts(undefined);
        saveWalletStorage({ connected: false });
      };
      disconnectListenerRef.current = nextDisconnectListener;

      nextChainChangedListener = (chainId: string) => {
        if (next !== walletProviderRef.current) {
          return;
        }
        console.log(`[useWallet] on('chainChanged') chainId=${chainId}`);
        _setCurrentProvider(next);
        const newChainId = Number.parseInt(chainId, 16);
        _setChainId(newChainId);
        saveWalletStorage({
          lastChainId: newChainId,
        });
      };
      chainChangedListenerRef.current = nextChainChangedListener;

      nextAccountsChangedListener = (accounts: string[]) => {
        if (next !== walletProviderRef.current) {
          return;
        }
        console.log(
          `[useWallet] on('accountsChanged') accounts.length=${accounts.length}`
        );
        _setCurrentProvider(next);
        _setAccounts(accounts);
        saveWalletStorage({
          lastAccounts: accounts,
        });
      };
      accountsChangedListenerRef.current = nextAccountsChangedListener;

      if (next.on) {
        next.on("connect", nextConnectListener);
        next.on("disconnect", nextDisconnectListener);
        next.on("chainChanged", nextChainChangedListener);
        next.on?.("accountsChanged", nextAccountsChangedListener);
      } else {
        next.addListener?.("connect", nextConnectListener);
        next.addListener?.("disconnect", nextDisconnectListener);
        next.addListener?.("chainChanged", nextChainChangedListener);
        next.addListener?.("accountsChanged", nextAccountsChangedListener);
      }

      const updateChainId = async () => {
        if (next !== walletProviderRef.current) {
          return;
        }

        try {
          const [chainIdHex, accountsArray] = await Promise.all([
            next.request({ method: "eth_chainId" }),
            next.request({ method: "eth_accounts" }),
          ]);

          console.log(
            `[useWallet] connected to chainId=${chainIdHex} accounts.length=${accountsArray.length}`
          );

          _setCurrentProvider(next);
          const newChainId = Number.parseInt(chainIdHex, 16);
          _setChainId(newChainId);
          _setAccounts(accountsArray as string[]);
          
          saveWalletStorage({
            lastChainId: newChainId,
            lastAccounts: accountsArray as string[],
            connected: accountsArray.length > 0,
          });
        } catch {
          console.log(`[useWallet] not connected!`);
          _setCurrentProvider(next);
          _setChainId(undefined);
          _setAccounts(undefined);
        }
      };

      updateChainId();
    }
  }, [providers, selectedConnectorId]);

  useEffect(() => {
    return () => {
      const current = walletProviderRef.current;

      if (current) {
        const chainChangedListener = chainChangedListenerRef.current;
        const accountsChangedListener = accountsChangedListenerRef.current;
        const connectListener = connectListenerRef.current;
        const disconnectListener = disconnectListenerRef.current;

        if (connectListener) {
          current.off?.("connect", connectListener);
          current.removeListener?.("connect", connectListener);
        }
        if (disconnectListener) {
          current.off?.("disconnect", disconnectListener);
          current.removeListener?.("disconnect", disconnectListener);
        }
        if (chainChangedListener) {
          current.off?.("chainChanged", chainChangedListener);
          current.removeListener?.("chainChanged", chainChangedListener);
        }
        if (accountsChangedListener) {
          current.off?.("accountsChanged", accountsChangedListener);
          current.removeListener?.("accountsChanged", accountsChangedListener);
        }
      }

      chainChangedListenerRef.current = undefined;
      walletProviderRef.current = undefined;
    };
  }, []);

  return {
    provider: _currentProvider,
    chainId,
    accounts,
    isConnected,
    error: eip6963Error,
    connect,
    disconnect,
    selectedConnectorId,
  };
}

interface WalletProviderProps {
  children: ReactNode;
}

const WalletContext = createContext<UseWalletState | undefined>(undefined);

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
}) => {
  const state = useWalletInternal();
  return (
    <WalletContext.Provider value={state}>
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

