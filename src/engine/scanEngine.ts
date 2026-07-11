import * as path from "path";
import * as fs from "fs";

import { fetchWasmForContract } from "../rpc/wasm";
import { StellarRpcService, type StellarNetwork } from "../rpc/stellar";
import { parseWasm } from "../parser/wasmParser";
import { runAllDetectors } from "../detectors/detectorRunner";
import { calculateRisk } from "../analysis/riskEngine";
import { saveReport, type SavedReport } from "../storage/reportStore";
import { writeHtmlReport } from "../report/htmlReport";
import type { Finding } from "../utils/types";

export interface ScanOptions {
  network?: StellarNetwork;
  rpcUrl?: string;
  html?: boolean;
  outputDir?: string;
}

export interface ScanResult {
  report: SavedReport;
  reportPath: string;
  htmlPath: string | undefined;
  durationMs: number;
}

export async function scanContract(
  contractId: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const start = Date.now();
  const network = options.network ?? "testnet";

  // 1. Fetch contract metadata from RPC
  const stellarService = new StellarRpcService(options.rpcUrl, network);
  const contractSummary = await stellarService.getContractSummary(contractId);

  // 2. Download WASM
  const wasmResult = await fetchWasmForContract(contractId, network, options.rpcUrl);

  // 3. Parse WASM
  const parsed = parseWasm(wasmResult.filePath);

  // Use contract name from WASM metadata if available, fall back to RPC summary
  const contractName =
    parsed.contractName ?? contractSummary.contractName;

  // 4. Run all detectors
  const findings: Finding[] = runAllDetectors(parsed);

  // 5. Calculate risk
  const risk = calculateRisk(findings);

  // 6. Build report
  const report: SavedReport = {
    contractId,
    contractName,
    network,
    ...(contractSummary.wasmHash !== undefined ? { wasmHash: contractSummary.wasmHash } : {}),
    riskScore: risk.riskScore,
    critical: risk.critical,
    high: risk.high,
    medium: risk.medium,
    low: risk.low,
    timestamp: new Date().toISOString(),
    scannedBy: "sentinel",
    findings,
  };

  // 7. Save JSON report
  const reportPath = saveReport(report);

  // 8. Optionally write HTML report
  let htmlPath: string | undefined;
  if (options.html) {
    const outDir = options.outputDir ?? path.dirname(reportPath);
    htmlPath = writeHtmlReport(report, outDir);
  }

  return {
    report,
    reportPath,
    htmlPath: htmlPath,
    durationMs: Date.now() - start,
  };
}

export async function scanLocalWasm(
  wasmFilePath: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const start = Date.now();

  if (!fs.existsSync(wasmFilePath)) {
    throw new Error(`WASM file not found: ${wasmFilePath}`);
  }

  const parsed = parseWasm(wasmFilePath);
  const contractId = path.basename(wasmFilePath, ".wasm");
  const contractName = parsed.contractName ?? contractId;

  const findings: Finding[] = runAllDetectors(parsed);
  const risk = calculateRisk(findings);

  const report: SavedReport = {
    contractId,
    contractName,
    network: "local",
    riskScore: risk.riskScore,
    critical: risk.critical,
    high: risk.high,
    medium: risk.medium,
    low: risk.low,
    timestamp: new Date().toISOString(),
    scannedBy: "sentinel",
    findings,
  };

  const reportPath = saveReport(report);

  let htmlPath: string | undefined;
  if (options.html) {
    const outDir = options.outputDir ?? path.dirname(reportPath);
    htmlPath = writeHtmlReport(report, outDir);
  }

  return { report, reportPath, htmlPath: htmlPath, durationMs: Date.now() - start };
}
