"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import {
  connectWallet as connectFreighter,
  getWalletInfo,
} from "@/services/freighter";

type WalletContextType = {
  connected: boolean;
  loading: boolean;
  address: string | null;
  network: string | null;
  connectWallet: () => Promise<void>;
  refreshWallet: () => Promise<void>;
};

const WalletContext = createContext<WalletContextType | undefined>(
  undefined
);

export function WalletProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);

  async function refreshWallet() {
    try {
      setLoading(true);

      const wallet = await getWalletInfo();

      if (!wallet) {
        setConnected(false);
        setAddress(null);
        setNetwork(null);
        return;
      }

      setConnected(true);
      setAddress(wallet.address);
      setNetwork(wallet.network);
    } catch (err) {
      console.error(err);

      setConnected(false);
      setAddress(null);
      setNetwork(null);
    } finally {
      setLoading(false);
    }
  }

  async function connectWallet() {
    try {
      await connectFreighter();

      await refreshWallet();
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    refreshWallet();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        connected,
        loading,
        address,
        network,
        connectWallet,
        refreshWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error(
      "useWallet must be used inside WalletProvider"
    );
  }

  return context;
}