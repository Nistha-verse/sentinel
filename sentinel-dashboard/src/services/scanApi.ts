const API_BASE = process.env.NEXT_PUBLIC_SENTINEL_API ?? "http://localhost:3001";

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

export function getReportJsonUrl(contractId: string): string {
  return `${API_BASE}/api/report/${contractId}/json`;
}

export function getReportHtmlUrl(contractId: string): string {
  return `${API_BASE}/api/report/${contractId}/html`;
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
