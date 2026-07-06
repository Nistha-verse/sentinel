import type { ParsedReport, SentinelReport } from "./report-types";
import { parseReportJson } from "./parse-report";

const STORAGE_KEY = "sentinel_report_storage";
const STORAGE_SCHEMA_VERSION = 1;

type WalletAddress = string | null;

type WalletStorageKey = string;

export interface StoredReport {
  id: string;
  walletAddress: WalletAddress;
  fileName: string;
  importedAt: string;
  raw: SentinelReport;
}

export interface LoadedReport extends StoredReport {
  parsed: ParsedReport;
}

export interface ScanHistoryEntry {
  reportId: string;
  walletAddress: WalletAddress;
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

export interface ReportStorageAdapter {
  saveReport(walletAddress: WalletAddress, report: StoredReport): Promise<void>;
  loadReports(walletAddress: WalletAddress): Promise<StoredReport[]>;
  loadReportById(
    walletAddress: WalletAddress,
    reportId: string
  ): Promise<StoredReport | null>;
  clearReports(walletAddress: WalletAddress): Promise<void>;
}

interface ReportStorageSchemaV1 {
  version: typeof STORAGE_SCHEMA_VERSION;
  walletReports: Record<WalletStorageKey, WalletReportCollection>;
}

interface WalletReportCollection {
  walletAddress: WalletAddress;
  reports: StoredReport[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStoredReport(value: unknown): value is StoredReport {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    (typeof value.walletAddress === "string" || value.walletAddress === null) &&
    typeof value.fileName === "string" &&
    typeof value.importedAt === "string" &&
    isRecord(value.raw)
  );
}

function walletStorageKey(walletAddress: WalletAddress): WalletStorageKey {
  return walletAddress?.toLowerCase() ?? "unknown";
}

function createEmptyStorage(): ReportStorageSchemaV1 {
  return {
    version: STORAGE_SCHEMA_VERSION,
    walletReports: {},
  };
}

function parseStorage(raw: unknown): ReportStorageSchemaV1 {
  if (!isRecord(raw)) return createEmptyStorage();
  if (raw.version !== STORAGE_SCHEMA_VERSION) return createEmptyStorage();
  if (!isRecord(raw.walletReports)) return createEmptyStorage();

  const walletReports: Record<WalletStorageKey, WalletReportCollection> = {};

  for (const [key, value] of Object.entries(raw.walletReports)) {
    if (!isRecord(value)) continue;

    const walletAddress =
      typeof value.walletAddress === "string" || value.walletAddress === null
        ? value.walletAddress
        : null;

    const reports = Array.isArray(value.reports)
      ? value.reports.filter(isStoredReport)
      : [];

    walletReports[key] = {
      walletAddress,
      reports,
    };
  }

  return {
    version: STORAGE_SCHEMA_VERSION,
    walletReports,
  };
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined" || typeof window.localStorage === "undefined") {
    return null;
  }
  return window.localStorage;
}

async function readSchema(): Promise<ReportStorageSchemaV1> {
  const storage = getBrowserStorage();
  if (!storage) return createEmptyStorage();

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStorage();
    return parseStorage(JSON.parse(raw));
  } catch {
    return createEmptyStorage();
  }
}

async function writeSchema(schema: ReportStorageSchemaV1): Promise<void> {
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(schema));
  } catch {
    // ignore write errors in unsupported environments
  }
}

function notifyReportUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REPORT_UPDATED_EVENT));
  }
}

function toHistoryEntry(
  report: LoadedReport
): ScanHistoryEntry {
  const { parsed, fileName, importedAt, reportId, walletAddress } = report;
  const { summary } = parsed;

  return {
    reportId,
    walletAddress,
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

function deriveScanStatus(
  errors: number,
  warnings: number
): ScanHistoryEntry["status"] {
  if (errors > 0) return "critical";
  if (warnings > 0) return "warning";
  return "success";
}

function createReportId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const localStorageReportStorage: ReportStorageAdapter = {
  async saveReport(walletAddress, report) {
    const schema = await readSchema();
    const key = walletStorageKey(walletAddress);
    const walletCollection = schema.walletReports[key] ?? {
      walletAddress,
      reports: [],
    };

    walletCollection.reports = [report, ...walletCollection.reports].slice(0, 100);
    schema.walletReports[key] = walletCollection;

    await writeSchema(schema);
  },

  async loadReports(walletAddress) {
    const schema = await readSchema();
    const key = walletStorageKey(walletAddress);
    const reports = schema.walletReports[key]?.reports ?? [];
    return [...reports].sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  },

  async loadReportById(walletAddress, reportId) {
    const reports = await this.loadReports(walletAddress);
    return reports.find((report) => report.id === reportId) ?? null;
  },

  async clearReports(walletAddress) {
    const schema = await readSchema();
    const key = walletStorageKey(walletAddress);
    delete schema.walletReports[key];
    await writeSchema(schema);
  },
};

let currentStorageAdapter: ReportStorageAdapter = localStorageReportStorage;

export function setReportStorageAdapter(adapter: ReportStorageAdapter) {
  currentStorageAdapter = adapter;
}

export async function saveReport(
  fileName: string,
  raw: SentinelReport,
  walletAddress: WalletAddress = null
): Promise<ParsedReport> {
  const parsed = parseReportJson(raw);
  const importedAt = new Date().toISOString();

  const stored: StoredReport = {
    id: createReportId(),
    walletAddress,
    fileName,
    importedAt,
    raw,
  };

  await currentStorageAdapter.saveReport(walletAddress, stored);
  notifyReportUpdated();

  return parsed;
}

export async function loadReports(
  walletAddress: WalletAddress = null
): Promise<LoadedReport[]> {
  const reports = await currentStorageAdapter.loadReports(walletAddress);

  return reports
    .map((report) => {
      try {
        return {
          ...report,
          parsed: parseReportJson(report.raw),
        };
      } catch {
        return null;
      }
    })
    .filter((report): report is LoadedReport => report !== null);
}

export async function loadStoredReport(
  walletAddress: WalletAddress = null
): Promise<{
  parsed: ParsedReport;
  fileName: string;
  importedAt: string;
  reportId: string;
  walletAddress: WalletAddress;
} | null> {
  const reports = await loadReports(walletAddress);
  if (reports.length === 0) return null;

  const latest = reports[0];
  return {
    parsed: latest.parsed,
    fileName: latest.fileName,
    importedAt: latest.importedAt,
    reportId: latest.id,
    walletAddress: latest.walletAddress,
  };
}

export async function loadReportById(
  reportId: string,
  walletAddress: WalletAddress = null
): Promise<LoadedReport | null> {
  const report = await currentStorageAdapter.loadReportById(walletAddress, reportId);
  if (!report) return null;

  try {
    return {
      ...report,
      parsed: parseReportJson(report.raw),
    };
  } catch {
    return null;
  }
}

export async function loadScanHistory(
  walletAddress: WalletAddress = null
): Promise<ScanHistoryEntry[]> {
  const reports = await loadReports(walletAddress);
  return reports.map(toHistoryEntry);
}

export async function clearStoredReport(
  walletAddress: WalletAddress = null
): Promise<void> {
  await currentStorageAdapter.clearReports(walletAddress);
  notifyReportUpdated();
}

export function getHealthStatus(
  errors: number,
  warnings: number
): string {
  if (errors > 0) return "Validation failed";
  if (warnings > 0) return "Review recommended";
  return "Healthy";
}
