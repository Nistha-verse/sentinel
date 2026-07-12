import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);

export class MetadataDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "metadata",
    name: "Metadata Detector",
    description: "Extracts contract metadata: functions, storage usage, instruction count",
    category: "metadata",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const funcExports = contract.exports.filter(
      (e) => e.kind === "Func" && !RUNTIME_EXPORTS.has(e.name)
    );

    const exportedIndices = new Set(
      funcExports.map((e) => e.funcIndex).filter((i): i is number => i !== null)
    );

    const internalFuncs = contract.functions.filter(
      (f) => !exportedIndices.has(f.index)
    );

    const totalInstructions = contract.functions.reduce(
      (sum, f) => sum + f.instructions.length, 0
    );

    const storageWriteFuncs = contract.functions.filter((f) => f.hasLedgerWrite).length;
    const storageReadFuncs = contract.functions.filter((f) => f.hasLedgerRead).length;
    const authFuncs = contract.functions.filter((f) => f.hasAuthCall).length;

    findings.push({
      detector: this.meta.id,
      title: "Contract Overview",
      severity: "info",
      confidence: "high",
      description:
        `Total functions: ${contract.functions.length} ` +
        `(${funcExports.length} exported, ${internalFuncs.length} internal). ` +
        `Imports: ${contract.imports.length}. ` +
        `Total instructions: ${totalInstructions}. ` +
        `Storage writers: ${storageWriteFuncs}, readers: ${storageReadFuncs}. ` +
        `Functions with auth: ${authFuncs}.`,
      recommendation: "Review contract structure for completeness.",
      evidence: `WASM size: ${contract.raw.length} bytes`,
    });

    if (funcExports.length > 0) {
      findings.push({
        detector: this.meta.id,
        title: "Exported Functions",
        severity: "info",
        confidence: "high",
        description:
          `Public entrypoints (${funcExports.length}): ` +
          funcExports.map((e) => e.name).join(", "),
        recommendation: "Verify all exported functions are intentionally public.",
        evidence: `${funcExports.length} function exports`,
      });
    }

    if (contract.contractName) {
      findings.push({
        detector: this.meta.id,
        title: "Contract Name Extracted",
        severity: "info",
        confidence: "high",
        description: `Contract name from metadata: '${contract.contractName}'`,
        recommendation: "Verify the contract name matches the expected deployment.",
        evidence: "Extracted from contractmetav0 custom section",
      });
    }

    if (contract.customSections.length > 0) {
      const sectionNames = contract.customSections.map((s) => s.name).join(", ");
      findings.push({
        detector: this.meta.id,
        title: "Custom Sections Present",
        severity: "info",
        confidence: "high",
        description:
          `Contract contains ${contract.customSections.length} custom section(s): ${sectionNames}. ` +
          `Soroban contracts typically include contractspecv0 (ABI) and contractmetav0 (metadata).`,
        recommendation: "Verify custom sections contain expected Soroban metadata.",
        evidence: sectionNames,
      });
    }

    return findings;
  }
}
