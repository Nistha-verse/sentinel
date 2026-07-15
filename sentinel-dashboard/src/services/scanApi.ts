/**
 * Base URL for all Sentinel API calls.
 *
 * Default: "" (empty string) — calls go to the Next.js Route Handlers at
 * the same origin (/api/scan, /api/history, etc.).
 *
 * Override: set NEXT_PUBLIC_SENTINEL_API=http://localhost:3001 in .env.local
 * if you want to point at the standalone Express server instead.
 */
const API_BASE = process.env.NEXT_PUBLIC_SENTINEL_API ?? "";

export interface StartScanResponse {
  scanId: string;
  status: string;
  message: string;
}

export interface ScanStatusResponse {
  scanId: string;
  contractId: string;
  network: string;
  status: "pending" | "running" | "complete" | "error";
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  result?: {
    riskScore: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    findingsCount: number;
    reportPath: string;
    htmlPath?: string;
  };
}

export interface HistoryEntry {
  contractId: string;
  contractName: string;
  network: string;
  riskScore: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  timestamp: string;
  findingsCount: number;
}

export interface RawReport {
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
  findings: Array<{
    detector: string;
    title: string;
    severity: string;
    confidence: string;
    description: string;
    recommendation: string;
    evidence?: string;
    affectedFunction?: string;
  }>;
}

export async function startScan(
  contractId: string,
  network: "testnet" | "mainnet"
): Promise<StartScanResponse> {
  const res = await fetch(`${API_BASE}/api/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractId, network }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<StartScanResponse>;
}

export async function pollScan(scanId: string): Promise<ScanStatusResponse> {
  const res = await fetch(`${API_BASE}/api/scan/${scanId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<ScanStatusResponse>;
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const res = await fetch(`${API_BASE}/api/history`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<HistoryEntry[]>;
}

export async function fetchRawReport(contractId: string): Promise<RawReport> {
  const res = await fetch(`${API_BASE}/api/report/${contractId}/raw`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<RawReport>;
}

export function getReportJsonUrl(contractId: string): string {
  return `${API_BASE}/api/report/${contractId}/json`;
}

export function getReportHtmlUrl(contractId: string): string {
  return `${API_BASE}/api/report/${contractId}/html`;
}

export function getRawReportUrl(contractId: string): string {
  return `${API_BASE}/api/report/${contractId}/raw`;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
