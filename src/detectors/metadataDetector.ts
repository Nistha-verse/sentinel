import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

export class MetadataDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "metadata",
    name: "Metadata Detector",
    description: "Extracts contract metadata from Soroban custom sections and WASM structure",
    category: "metadata",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const funcExports = contract.exports.filter(
      (e) => e.kind === "Func" && !["memory", "__data_end", "__heap_base", "_"].includes(e.name)
    );

    findings.push({
      detector: this.meta.id,
      title: "Contract Overview",
      severity: "info",
      description:
        `Functions: ${contract.functions.length}, ` +
        `Imports: ${contract.imports.length}, ` +
        `Exports: ${contract.exports.length}, ` +
        `Public entrypoints: ${funcExports.length}`,
      recommendation: "Review contract structure for completeness.",
      evidence: `WASM size: ${contract.raw.length} bytes`,
    });

    if (contract.contractName) {
      findings.push({
        detector: this.meta.id,
        title: "Contract Name Extracted",
        severity: "info",
        description: `Contract name from metadata: '${contract.contractName}'`,
        recommendation: "Verify the contract name matches the expected deployment.",
        evidence: `Extracted from contractmetav0 custom section`,
      });
    }

    // Custom sections summary
    if (contract.customSections.length > 0) {
      const sectionNames = contract.customSections.map((s) => s.name).join(", ");
      findings.push({
        detector: this.meta.id,
        title: "Custom Sections Present",
        severity: "info",
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
