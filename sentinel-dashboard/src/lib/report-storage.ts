import type { ParsedReport, SentinelReport } from "./report-types";
import { parseReportJson } from "./parse-report";

const STORAGE_KEY = "sentinel_cli_report";
const HISTORY_KEY = "sentinel_scan_history";
const MAX_HISTORY = 20;

interface StoredReport {
  fileName: string;
  importedAt: string;
  raw: SentinelReport;
}

export interface ScanHistoryEntry {
  contractName: string;
  scanTimestamp: string;
  importedAt: string;
  fileName: string;
  healthScore: number;
  coveragePercent: number | null;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  status: "critical" | "warning" | "success";
}

export const REPORT_UPDATED_EVENT = "sentinel-report-updated";

function notifyReportUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REPORT_UPDATED_EVENT));
  }
}

function deriveScanStatus(
  errors: number,
  warnings: number
): ScanHistoryEntry["status"] {
  if (errors > 0) return "critical";
  if (warnings > 0) return "warning";
  return "success";
}

function toHistoryEntry(
  parsed: ParsedReport,
  fileName: string,
  importedAt: string
): ScanHistoryEntry {
  const { summary } = parsed;
  return {
    contractName: parsed.contractName,
    scanTimestamp: parsed.scanTimestamp,
    importedAt,
    fileName,
    healthScore: parsed.healthScore,
    coveragePercent: parsed.coveragePercent,
    totalIssues: summary.errors + summary.warnings + summary.info,
    criticalCount: summary.errors,
    warningCount: summary.warnings,
    status: deriveScanStatus(summary.errors, summary.warnings),
  };
}

function appendScanHistory(entry: ScanHistoryEntry): void {
  if (typeof window === "undefined") return;

  let history: ScanHistoryEntry[] = [];
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (raw) history = JSON.parse(raw) as ScanHistoryEntry[];
  } catch {
    history = [];
  }

  history = [
    entry,
    ...history.filter((h) => h.importedAt !== entry.importedAt),
  ].slice(0, MAX_HISTORY);

  sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function saveReport(fileName: string, raw: SentinelReport): ParsedReport {
  const parsed = parseReportJson(raw);
  const importedAt = new Date().toISOString();
  const stored: StoredReport = {
    fileName,
    importedAt,
    raw,
  };

  if (typeof window !== "undefined") {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    appendScanHistory(toHistoryEntry(parsed, fileName, importedAt));
    notifyReportUpdated();
  }

  return parsed;
}

export function loadStoredReport(): {
  parsed: ParsedReport;
  fileName: string;
  importedAt: string;
} | null {
  if (typeof window === "undefined") return null;

  const data = sessionStorage.getItem(STORAGE_KEY);
  if (!data) return null;

  try {
    const stored = JSON.parse(data) as StoredReport;
    const parsed = parseReportJson(stored.raw);
    return {
      parsed,
      fileName: stored.fileName,
      importedAt: stored.importedAt,
    };
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function loadScanHistory(): ScanHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (raw) {
      const history = JSON.parse(raw) as ScanHistoryEntry[];
      if (history.length > 0) return history;
    }
  } catch {
    // fall through to seed from current report
  }

  const stored = loadStoredReport();
  if (stored) {
    return [
      toHistoryEntry(stored.parsed, stored.fileName, stored.importedAt),
    ];
  }

  return [];
}

export function clearStoredReport(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(HISTORY_KEY);
    notifyReportUpdated();
  }
}

export function getHealthStatus(
  errors: number,
  warnings: number
): string {
  if (errors > 0) return "Validation failed";
  if (warnings > 0) return "Review recommended";
  return "Healthy";
}
