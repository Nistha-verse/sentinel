import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";
import type { IDetector } from "./IDetector";

import { AuthDetector } from "./authDetector";
import { LoopDetector } from "./loopDetector";
import { PanicDetector } from "./panicDetector";
import { ReentrancyDetector } from "./reentrancyDetector";
import { StorageDetector } from "./storageDetector";
import { UpgradeDetector } from "./upgradeDetector";
import { CrossContractDetector } from "./crossContractDetector";
import { PrivilegeDetector } from "./privilegeDetector";
import { InitializationDetector } from "./initializationDetector";
import { HostFunctionDetector } from "./hostFunctionDetector";
import { MemoryDetector } from "./memoryDetector";
import { CallDetector } from "./callDetector";
import { ExportDetector } from "./exportDetector";
import { ImportDetector } from "./importDetector";
import { MetadataDetector } from "./metadataDetector";

export interface DetectorResult {
  detectorId: string;
  detectorName: string;
  findings: Finding[];
  durationMs: number;
  error?: string;
}

const DETECTORS: IDetector[] = [
  new MetadataDetector(),
  new ExportDetector(),
  new ImportDetector(),
  new HostFunctionDetector(),
  new AuthDetector(),
  new InitializationDetector(),
  new StorageDetector(),
  new UpgradeDetector(),
  new PrivilegeDetector(),
  new ReentrancyDetector(),
  new CrossContractDetector(),
  new LoopDetector(),
  new PanicDetector(),
  new MemoryDetector(),
  new CallDetector(),
];

export function runAllDetectors(contract: ParsedContract): Finding[] {
  const allFindings: Finding[] = [];

  for (const detector of DETECTORS) {
    try {
      const start = Date.now();
      const findings = detector.run(contract);
      const duration = Date.now() - start;

      if (process.env.SENTINEL_DEBUG === "1") {
        console.error(
          `[${detector.meta.id}] ${findings.length} findings in ${duration}ms`
        );
      }

      allFindings.push(...findings);
    } catch (err) {
      console.error(
        `Detector '${detector.meta.id}' failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return allFindings;
}

export function runAllDetectorsWithMeta(contract: ParsedContract): DetectorResult[] {
  const results: DetectorResult[] = [];

  for (const detector of DETECTORS) {
    const start = Date.now();
    try {
      const findings = detector.run(contract);
      results.push({
        detectorId: detector.meta.id,
        detectorName: detector.meta.name,
        findings,
        durationMs: Date.now() - start,
      });
    } catch (err) {
      results.push({
        detectorId: detector.meta.id,
        detectorName: detector.meta.name,
        findings: [],
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
