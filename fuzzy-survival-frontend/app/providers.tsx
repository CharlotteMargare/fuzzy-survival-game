"use client";

import type { ReactNode } from "react";

import { WalletProvider } from "@/hooks/wallet/useWallet";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { EthersSignerProvider } from "@/hooks/wallet/useEthersSigner";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <WalletProvider>
      <EthersSignerProvider initialMockChains={{ 31337: "http://localhost:8545" }}>
        <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
      </EthersSignerProvider>
    </WalletProvider>
  );
}

