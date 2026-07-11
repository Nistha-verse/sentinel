import * as fs from "fs";
import * as path from "path";
import type { Finding } from "../utils/types";

export type { Finding };

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

const reportsDir = path.resolve(process.cwd(), "reports");

function ensureReportsDirectory(): void {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

export function saveReport(report: SavedReport): string {
  ensureReportsDirectory();

  const reportPath = path.join(reportsDir, `${report.contractId}.json`);

  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
    return reportPath;
  } catch (error) {
    throw new Error(
      `Failed to save report: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export function loadReport(contractId: string): SavedReport | null {
  const reportPath = path.join(reportsDir, `${contractId}.json`);

  if (!fs.existsSync(reportPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(reportPath, "utf8")) as SavedReport;
  } catch {
    return null;
  }
}

export function listReports(): SavedReport[] {
  if (!fs.existsSync(reportsDir)) return [];

  try {
    return fs
      .readdirSync(reportsDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        try {
          return JSON.parse(
            fs.readFileSync(path.join(reportsDir, file), "utf8")
          ) as SavedReport;
        } catch {
          return null;
        }
      })
      .filter((r): r is SavedReport => r !== null)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch {
    return [];
  }
}

export function reportExists(contractId: string): boolean {
  return fs.existsSync(path.join(reportsDir, `${contractId}.json`));
}
