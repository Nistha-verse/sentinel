"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isSupportedNetwork } from "@/components/wallet/wallet-states";
import { useWallet } from "@/context/WalletContext";
import { enrichDiscoveredContracts } from "@/lib/contract-enrichment";
import type {
  DiscoveryCache,
  EnrichedProject,
} from "@/lib/discovered-contract-types";
import {
  DISCOVERY_UPDATED_EVENT,
  discoveryCacheKey,
  notifyDiscoveryUpdated,
} from "@/lib/discovered-contract-types";
import { resolveNetwork } from "@/lib/network-config";
import { loadScanHistory, REPORT_UPDATED_EVENT } from "@/lib/report-storage";
import { discoverWalletContracts } from "@/services/contractDiscovery";

export type DiscoveryPhase = "idle" | "scanning" | "complete" | "error";

function loadCachedDiscovery(
  address: string,
  network: string
): DiscoveryCache | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(discoveryCacheKey(address, network));
    if (!raw) return null;
    return JSON.parse(raw) as DiscoveryCache;
  } catch {
    return null;
  }
}

function saveCachedDiscovery(cache: DiscoveryCache): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    discoveryCacheKey(cache.address, cache.network),
    JSON.stringify(cache)
  );
  notifyDiscoveryUpdated();
}

export function useContractDiscovery() {
  const { connected, address, network, loading: walletLoading } = useWallet();
  const [phase, setPhase] = useState<DiscoveryPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [projects, setProjects] = useState<EnrichedProject[]>([]);
  const [error, setError] = useState<string | null>(null);

  const runIdRef = useRef(0);

  const refreshProjects = useCallback(async () => {
    if (!address || !network) {
      setProjects([]);
      return;
    }

    const cached = loadCachedDiscovery(address, network);
    if (!cached) {
      setProjects([]);
      return;
    }

    const history = await loadScanHistory(address);
    setProjects(enrichDiscoveredContracts(cached.contracts, history, address));
  }, [address, network]);

  const runDiscovery = useCallback(async () => {
    if (!address || !network || !isSupportedNetwork(network)) {
      setPhase("idle");
      setProjects([]);
      return;
    }

    const resolvedNetwork = resolveNetwork(network);
    if (!resolvedNetwork) {
      setPhase("error");
      setError("Unsupported network for contract discovery.");
      return;
    }

    const runId = ++runIdRef.current;
    setPhase("scanning");
    setProgress(0);
    setError(null);

    try {
      const contracts = await discoverWalletContracts(
        address,
        resolvedNetwork,
        (value) => {
          if (runId === runIdRef.current) {
            setProgress(value);
          }
        }
      );

      if (runId !== runIdRef.current) return;

      const cache: DiscoveryCache = {
        address,
        network: resolvedNetwork,
        discoveredAt: new Date().toISOString(),
        contracts,
      };

      saveCachedDiscovery(cache);

      const history = await loadScanHistory(address);
      setProjects(enrichDiscoveredContracts(contracts, history, address));
      setPhase("complete");
    } catch (err) {
      if (runId !== runIdRef.current) return;

      setPhase("error");
      setError(
        err instanceof Error ? err.message : "Contract discovery failed."
      );
      setProjects([]);
    }
  }, [address, network]);

  useEffect(() => {
    if (walletLoading) return;

    if (!connected || !address || !network || !isSupportedNetwork(network)) {
      setPhase("idle");
      setProgress(0);
      setProjects([]);
      setError(null);
      return;
    }

    const cached = loadCachedDiscovery(address, network);
    if (cached) {
      void refreshProjects();
      setPhase("complete");
      setProgress(100);
      return;
    }

    void runDiscovery();
  }, [connected, address, network, walletLoading, runDiscovery, refreshProjects]);

  useEffect(() => {
    const handleDataUpdate = () => refreshProjects();
    window.addEventListener(REPORT_UPDATED_EVENT, handleDataUpdate);
    window.addEventListener(DISCOVERY_UPDATED_EVENT, handleDataUpdate);
    return () => {
      window.removeEventListener(REPORT_UPDATED_EVENT, handleDataUpdate);
      window.removeEventListener(DISCOVERY_UPDATED_EVENT, handleDataUpdate);
    };
  }, [refreshProjects]);

  return {
    phase,
    progress,
    projects,
    error,
    retry: runDiscovery,
    isDiscovering: phase === "scanning",
  };
}
