"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useWallet } from "@/context/WalletContext";
import type { ParsedReport } from "@/lib/report-types";
import {
  loadReports,
  loadScanHistory,
  loadStoredReport,
  getHealthStatus,
  REPORT_UPDATED_EVENT,
  type ScanHistoryEntry,
} from "@/lib/report-storage";

export interface DashboardMetrics {
  coveragePercent: number | null;
  healthScore: number;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  contractName: string;
  scanTimestamp: string;
  fileName: string;
  importedAt: string;
  healthStatus: string;
  totalScans: number;
  totalContracts: number;
}

function buildMetrics(
  parsed: ParsedReport,
  fileName: string,
  importedAt: string,
  totalScans: number,
  totalContracts: number
): DashboardMetrics {
  const { summary } = parsed;
  return {
    coveragePercent: parsed.coveragePercent,
    healthScore: parsed.healthScore,
    totalIssues: summary.errors + summary.warnings + summary.info,
    criticalCount: summary.errors,
    warningCount: summary.warnings,
    infoCount: summary.info,
    contractName: parsed.contractName,
    scanTimestamp: parsed.scanTimestamp,
    fileName,
    importedAt,
    healthStatus: getHealthStatus(summary.errors, summary.warnings),
    totalScans,
    totalContracts,
  };
}

function countUniqueContracts(entries: ScanHistoryEntry[]): number {
  const names = new Set(entries.map((entry) => entry.contractName));
  return names.size;
}

export function useReportData() {
  const { address } = useWallet();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [parsed, setParsed] = useState<ParsedReport | null>(null);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const stored = await loadStoredReport(address);
    const scanHistory = await loadScanHistory(address);

    if (stored) {
      const totalScans = scanHistory.length;
      const totalContracts = countUniqueContracts(scanHistory);
      setParsed(stored.parsed);
      setMetrics(
        buildMetrics(
          stored.parsed,
          stored.fileName,
          stored.importedAt,
          totalScans,
          totalContracts
        )
      );
    } else {
      setParsed(null);
      setMetrics(null);
    }

    setHistory(scanHistory);
    setReady(true);
  }, [address]);

  useEffect(() => {
    void refresh();
    const handleUpdate = () => {
      void refresh();
    };

    window.addEventListener(REPORT_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(REPORT_UPDATED_EVENT, handleUpdate);
  }, [refresh]);

  return {
    metrics,
    parsed,
    history,
    ready,
    hasReport: metrics !== null,
    refresh,
  };
}
