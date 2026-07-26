"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchHistory, type HistoryEntry } from "@/services/scanApi";

export type { HistoryEntry };

interface UseApiHistoryOptions {
  /** Auto-refresh interval in ms. 0 = no polling. Default 30 000. */
  pollingInterval?: number;
}

export interface UseApiHistoryResult {
  history: HistoryEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Fetches scan history from the Sentinel API backend.
 * Both CLI scans and dashboard scans land in the same reports/ directory,
 * so this hook automatically unifies them.
 */
export function useApiHistory({
  pollingInterval = 30_000,
}: UseApiHistoryOptions = {}): UseApiHistoryResult {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchHistory();
      setHistory(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    if (pollingInterval > 0) {
      intervalRef.current = setInterval(() => void refresh(), pollingInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refresh, pollingInterval]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleUpdate = () => {
        void refresh();
      };
      window.addEventListener("sentinel-report-updated", handleUpdate);
      return () => {
        window.removeEventListener("sentinel-report-updated", handleUpdate);
      };
    }
  }, [refresh]);

  return { history, loading, error, refresh };
}
