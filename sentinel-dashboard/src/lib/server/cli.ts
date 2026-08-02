/**
 * Server-side adapter to the prebuilt Sentinel CLI (CommonJS).
 *
 * Isolation model:
 *   - `npm run build:scanner` compiles the sibling CLI package and copies
 *     output into `.sentinel-dist/` (not committed, not imported as TS).
 *   - This module talks to that build only via a Node child process
 *     (`scripts/scanner-bridge.cjs`), so Next.js 16 / Turbopack never sees
 *     CommonJS CLI sources or dist modules.
 *
 * ONLY import this file from Route Handlers (server-side code).
 * Never import it from client components.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

// ─── Inline types (mirror CLI SavedReport / Finding shapes) ─────────────────

export type Severity = "critical" | "high" | "medium" | "low" | "info";
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

// ─── Child-process bridge ───────────────────────────────────────────────────

type BridgeResponse<T> =
  | { ok: true; result: T }
  | { ok: false; error: string };

function resolveDashboardRoot(): string {
  const candidates = [
    process.cwd(),
    join(process.cwd(), "sentinel-dashboard"),
  ];
  for (const root of candidates) {
    if (
      existsSync(join(root, "scripts", "scanner-bridge.cjs")) &&
      existsSync(join(root, ".sentinel-dist", ".sentinel-built"))
    ) {
      return root;
    }
  }
  throw new Error(
    "Sentinel scanner build not found (.sentinel-dist). " +
      "Run `npm run build:scanner` from sentinel-dashboard/ before starting the app."
  );
}

function invokeBridge<T>(command: string, payload?: unknown): Promise<T> {
  const root = resolveDashboardRoot();
  const bridge = join(root, "scripts", "scanner-bridge.cjs");

  return new Promise<T>((resolve, reject) => {
    const child = spawn(process.execPath, [bridge, command], {
      cwd: root,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));

    child.on("error", reject);

    child.on("close", (code) => {
      const raw = Buffer.concat(stdout).toString("utf8").trim();
      const errText = Buffer.concat(stderr).toString("utf8").trim();

      if (!raw) {
        reject(
          new Error(
            errText ||
              `Scanner bridge exited with code ${code ?? "unknown"} and no output`
          )
        );
        return;
      }

      let parsed: BridgeResponse<T>;
      try {
        parsed = JSON.parse(raw) as BridgeResponse<T>;
      } catch {
        reject(
          new Error(
            `Scanner bridge returned invalid JSON (exit ${code}): ${raw.slice(0, 500)}`
          )
        );
        return;
      }

      if (!parsed.ok) {
        reject(new Error(parsed.error || "Scanner bridge failed"));
        return;
      }

      resolve(parsed.result);
    });

    child.stdin.end(payload === undefined ? "" : JSON.stringify(payload));
  });
}

// ─── Public API (same surface the API routes already use) ───────────────────

export async function scanContract(
  contractId: string,
  options?: ScanOptions
): Promise<ScanResult> {
  return invokeBridge<ScanResult>("scan", { contractId, options: options ?? {} });
}

export async function listReports(): Promise<SavedReport[]> {
  return invokeBridge<SavedReport[]>("listReports");
}

export async function loadReport(
  contractId: string
): Promise<SavedReport | null> {
  return invokeBridge<SavedReport | null>("loadReport", { contractId });
}

export async function generateHtmlReport(report: SavedReport): Promise<string> {
  return invokeBridge<string>("generateHtmlReport", { report });
}

export async function generateDashboardReport(
  report: SavedReport
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> {
  return invokeBridge<Record<string, unknown>>("generateDashboardReport", {
    report,
  });
}
