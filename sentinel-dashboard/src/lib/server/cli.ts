/**
 * Loads the pre-compiled Sentinel CLI modules using static require() strings.
 *
 * Turbopack (Next.js 16+) cannot resolve dynamic require(path.join(...))
 * calls at build time, so all require() calls here use literal relative
 * path strings that the bundler can statically trace.
 *
 * From this file (sentinel-dashboard/src/lib/server/cli.ts), four levels up
 * reaches the repo root, and dist/ lives there:
 *   ../../../../dist/  →  sentinel/dist/
 *
 * These modules are listed in serverExternalPackages in next.config.ts so
 * their Node.js / native dependencies are NOT bundled — they are resolved
 * from the repo-root node_modules at runtime.
 *
 * ONLY import this file from Route Handlers (server-side code).
 * Never import it from client components.
 */

// ─── Inline types (mirror src/utils/types.ts + src/storage/reportStore.ts) ──

export type Severity   = "critical" | "high" | "medium" | "low" | "info";
export type Confidence = "high" | "medium" | "low";

export interface Finding {
  detector: string;
  title: string;
  severity: Severity;
  confidence: Confidence;
  description: string;
  recommendation: string;
  evidence?: string;
  affectedFunction?: string;
}

export interface SavedReport {
  contractId: string;
  contractName: string;
  network: string;
  wasmHash?: string;
  riskScore: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  timestamp: string;
  scannedBy: string;
  findings: Finding[];
}

export interface ScanResult {
  report: SavedReport;
  reportPath: string;
  htmlPath: string | undefined;
  durationMs: number;
}

export type StellarNetwork = "testnet" | "mainnet" | "custom";

export interface ScanOptions {
  network?: StellarNetwork;
  rpcUrl?: string;
  html?: boolean;
  outputDir?: string;
}

// ─── Module interfaces ────────────────────────────────────────────────────────

interface ScanEngineModule {
  scanContract(contractId: string, options?: ScanOptions): Promise<ScanResult>;
}

interface ReportStoreModule {
  listReports(): SavedReport[];
  loadReport(contractId: string): SavedReport | null;
}

interface HtmlReportModule {
  generateHtmlReport(report: SavedReport): string;
}

interface JsonReportModule {
  // Returns the legacy SentinelReport shape consumed by the reports-page importer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generateDashboardReport(report: SavedReport): Record<string, any>;
}

// ─── Static require() — literal strings so Turbopack can trace them ──────────
// Path: 4 levels up from sentinel-dashboard/src/lib/server/ → sentinel/dist/

// eslint-disable-next-line @typescript-eslint/no-require-imports
const _scanEngine:   ScanEngineModule   = require("../../../../dist/engine/scanEngine");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _reportStore:  ReportStoreModule  = require("../../../../dist/storage/reportStore");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _htmlReport:   HtmlReportModule   = require("../../../../dist/report/htmlReport");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _jsonReport:   JsonReportModule   = require("../../../../dist/report/jsonReport");

// ─── Public exports ───────────────────────────────────────────────────────────

export const scanContract:            ScanEngineModule["scanContract"]              = (...args) => _scanEngine.scanContract(...args);
export const listReports:             ReportStoreModule["listReports"]             = (...args) => _reportStore.listReports(...args);
export const loadReport:              ReportStoreModule["loadReport"]              = (...args) => _reportStore.loadReport(...args);
export const generateHtmlReport:      HtmlReportModule["generateHtmlReport"]       = (...args) => _htmlReport.generateHtmlReport(...args);
export const generateDashboardReport: JsonReportModule["generateDashboardReport"]  = (...args) => _jsonReport.generateDashboardReport(...args);
