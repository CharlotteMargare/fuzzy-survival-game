"use client";

import { ethers } from "ethers";
import { useWallet } from "./useWallet";
import {
  createContext,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface UseEthersSignerState {
  provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  accounts: string[] | undefined;
  isConnected: boolean;
  error: Error | undefined;
  connect: (connectorId?: string) => Promise<void>;
  disconnect: () => void;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
  ethersBrowserProvider: ethers.BrowserProvider | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  initialMockChains: Readonly<Record<number, string>> | undefined;
}

function useEthersSignerInternal(parameters: { 
  initialMockChains?: Readonly<Record<number, string>> 
}): UseEthersSignerState {
  const { initialMockChains } = parameters;
  const { provider, chainId, accounts, isConnected, connect, disconnect, error } = useWallet();
  const [ethersSigner, setEthersSigner] = useState<
    ethers.JsonRpcSigner | undefined
  >(undefined);
  const [ethersBrowserProvider, setEthersBrowserProvider] = useState<
    ethers.BrowserProvider | undefined
  >(undefined);
  const [ethersReadonlyProvider, setEthersReadonlyProvider] = useState<
    ethers.ContractRunner | undefined
  >(undefined);

  const chainIdRef = useRef<number | undefined>(chainId);
  const ethersSignerRef = useRef<ethers.JsonRpcSigner | undefined>(undefined);

  const sameChain = useRef((chainId: number | undefined) => {
    return chainId === chainIdRef.current;
  });

  const sameSigner = useRef(
    (ethersSigner: ethers.JsonRpcSigner | undefined) => {
      return ethersSigner === ethersSignerRef.current;
    }
  );

  useEffect(() => {
    chainIdRef.current = chainId;
  }, [chainId]);

  useEffect(() => {
    if (
      !provider ||
      !chainId ||
      !isConnected ||
      !accounts ||
      accounts.length === 0
    ) {
      ethersSignerRef.current = undefined;
      setEthersSigner(undefined);
      setEthersBrowserProvider(undefined);
      setEthersReadonlyProvider(undefined);
      return;
    }

    console.warn(`[useEthersSigner] create new ethers.BrowserProvider(), chainId=${chainId}`);

    const bp: ethers.BrowserProvider = new ethers.BrowserProvider(provider);
    let rop: ethers.ContractRunner = bp;
    const rpcUrl: string | undefined = initialMockChains?.[chainId];
    if (rpcUrl) {
      rop = new ethers.JsonRpcProvider(rpcUrl);
      console.warn(`[useEthersSigner] create new readonly provider ethers.JsonRpcProvider(${rpcUrl}), chainId=${chainId}`);
    } else {
      console.warn(`[useEthersSigner] use ethers.BrowserProvider() as readonly provider, chainId=${chainId}`);
    }

    const s = new ethers.JsonRpcSigner(bp, accounts[0]);
    ethersSignerRef.current = s;
    setEthersSigner(s);
    setEthersBrowserProvider(bp);
    setEthersReadonlyProvider(rop);
  }, [provider, chainId, isConnected, accounts, initialMockChains]);

  return {
    sameChain,
    sameSigner,
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    disconnect,
    ethersBrowserProvider,
    ethersReadonlyProvider,
    ethersSigner,
    error,
    initialMockChains
  };
}

const EthersSignerContext = createContext<UseEthersSignerState | undefined>(
  undefined
);

interface EthersSignerProviderProps {
  children: ReactNode;
  initialMockChains: Readonly<Record<number, string>>;
}

export const EthersSignerProvider: React.FC<EthersSignerProviderProps> = ({
  children, initialMockChains
}) => {
  const props = useEthersSignerInternal({ initialMockChains });
  return (
    <EthersSignerContext.Provider value={props}>
      {children}
    </EthersSignerContext.Provider>
  );
};

export function useEthersSigner() {
  const context = useContext(EthersSignerContext);
  if (context === undefined) {
    throw new Error("useEthersSigner must be used within a EthersSignerProvider");
  }
  return context;
}

