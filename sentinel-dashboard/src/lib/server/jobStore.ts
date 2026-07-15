/**
 * File-backed scan job store for serverless environments.
 *
 * Serverless functions are stateless — an in-memory Map() is gone between
 * the POST /api/scan that starts a job and the GET /api/scan/:id that polls
 * it.  This module persists job state as JSON files in the same tmp/ directory
 * that the WASM downloader already uses, so both invocations can read/write
 * the same job record.
 *
 * File layout:  <cwd>/tmp/<scanId>.job.json
 */

import * as fs   from "fs";
import * as path from "path";

export type ScanStatus = "pending" | "running" | "complete" | "error";

export interface ScanJob {
  id: string;
  contractId: string;
  network: string;
  status: ScanStatus;
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
  };
}

const tmpDir = path.resolve(process.cwd(), "tmp");

function jobPath(id: string): string {
  return path.join(tmpDir, `${id}.job.json`);
}

function ensureTmp(): void {
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
}

export function writeJob(job: ScanJob): void {
  ensureTmp();
  fs.writeFileSync(jobPath(job.id), JSON.stringify(job, null, 2), "utf8");
}

export function readJob(id: string): ScanJob | null {
  const p = jobPath(id);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as ScanJob;
  } catch {
    return null;
  }
}

export function createJob(contractId: string, network: string): ScanJob {
  ensureTmp();
  const id = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: ScanJob = {
    id,
    contractId,
    network,
    status: "pending",
    progress: 0,
    startedAt: new Date().toISOString(),
  };
  writeJob(job);
  return job;
}
