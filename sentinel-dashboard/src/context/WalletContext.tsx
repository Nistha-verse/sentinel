"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

import {
  connectWallet as connectFreighter,
  getWalletInfo,
  disconnectWallet as disconnectFreighter,
  onMobileSessionEnd,
  FREIGHTER_UNAVAILABLE_MESSAGE,
} from "@/services/freighter";
import { useToast } from "@/components/ui/toast";

type WalletContextType = {
  connected: boolean;
  loading: boolean;
  address: string | null;
  network: string | null;
  connectWallet: () => Promise<void>;
  refreshWallet: () => Promise<void>;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);

  const refreshWallet = useCallback(async () => {
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
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      await connectFreighter();
      await refreshWallet();

      toast({
        variant: "success",
        message: "Wallet connected",
        description: "Freighter is linked to Sentinel.",
      });
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : FREIGHTER_UNAVAILABLE_MESSAGE;

      toast({
        variant: "error",
        message: "Connection failed",
        description: message,
      });

      // Preserve previous behavior for callers that ignore rejections,
      // while still allowing await connectWallet() to observe failure.
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setLoading(false);
    }
  }, [refreshWallet, toast]);

  useEffect(() => {
    void refreshWallet();

    onMobileSessionEnd(() => {
      void disconnectFreighter().then(() => refreshWallet());
    });
  }, [refreshWallet]);

  // Restore session when returning from Freighter Mobile (tab focus / visibility)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshWallet();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [refreshWallet]);

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
    throw new Error("useWallet must be used inside WalletProvider");
  }

  return context;
}
