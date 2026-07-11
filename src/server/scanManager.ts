import { scanContract } from "../engine/scanEngine";
import type { ScanResult } from "../engine/scanEngine";
import type { StellarNetwork } from "../rpc/stellar";

export type ScanStatus = "pending" | "running" | "complete" | "error";

export interface ScanJob {
  id: string;
  contractId: string;
  network: StellarNetwork;
  status: ScanStatus;
  progress: number;
  startedAt: string;
  completedAt?: string;
  result?: ScanResult;
  error?: string;
}

const jobs = new Map<string, ScanJob>();

function generateId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createScanJob(
  contractId: string,
  network: StellarNetwork = "testnet"
): ScanJob {
  const id = generateId();
  const job: ScanJob = {
    id,
    contractId,
    network,
    status: "pending",
    progress: 0,
    startedAt: new Date().toISOString(),
  };
  jobs.set(id, job);
  return job;
}

export function getScanJob(id: string): ScanJob | undefined {
  return jobs.get(id);
}

export function listScanJobs(): ScanJob[] {
  return Array.from(jobs.values()).sort(
    (a, b) => b.startedAt.localeCompare(a.startedAt)
  );
}

export async function startScanJob(job: ScanJob): Promise<void> {
  job.status = "running";
  job.progress = 10;

  try {
    job.progress = 30;
    const result = await scanContract(job.contractId, {
      network: job.network,
      html: true,
    });
    job.progress = 100;
    job.status = "complete";
    job.result = result;
    job.completedAt = new Date().toISOString();
  } catch (err) {
    job.status = "error";
    job.error = err instanceof Error ? err.message : String(err);
    job.completedAt = new Date().toISOString();
  }
}
