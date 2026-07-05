"use client";

import { useCallback, useEffect, useState } from "react";

import type { ParsedReport } from "@/lib/report-types";
import {
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
}

function buildMetrics(
  parsed: ParsedReport,
  fileName: string,
  importedAt: string
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
  };
}

export function useReportData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [parsed, setParsed] = useState<ParsedReport | null>(null);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const stored = loadStoredReport();
    const scanHistory = loadScanHistory();

    if (stored) {
      setParsed(stored.parsed);
      setMetrics(
        buildMetrics(stored.parsed, stored.fileName, stored.importedAt)
      );
    } else {
      setParsed(null);
      setMetrics(null);
    }

    setHistory(scanHistory);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(REPORT_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(REPORT_UPDATED_EVENT, refresh);
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
