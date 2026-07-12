import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";
import { SOROBAN_NAMESPACES } from "../parser/wasmParser";

export class ImportDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "import",
    name: "Import Detector",
    description: "Identifies non-Soroban host function imports",
    category: "host-interface",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    if (contract.imports.length === 0) {
      findings.push({
        detector: this.meta.id,
        title: "No Imports",
        severity: "info",
        confidence: "high",
        description: "Contract has no WASM imports. This is unusual for a Soroban contract.",
        recommendation: "Verify this is a valid Soroban contract.",
        evidence: "Import table is empty",
      });
      return findings;
    }

    const unknownImports = contract.imports.filter((i) => !(i.module in SOROBAN_NAMESPACES));

    // Only emit findings for genuinely unknown/non-Soroban imports
    for (const imp of unknownImports) {
      findings.push({
        detector: this.meta.id,
        title: "Non-Soroban Import Detected",
        severity: "medium",
        confidence: "high",
        description:
          `Import '${imp.key}' (module: '${imp.module}') is not a recognized ` +
          `Soroban host function namespace. This may indicate non-standard ` +
          `or potentially malicious tooling.`,
        recommendation:
          "Verify this import is expected. Non-Soroban imports may indicate " +
          "a contract compiled with non-standard tooling.",
        evidence: `Unknown import: ${imp.key}`,
      });
    }

    return findings;
  }
}
