import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";
import { SOROBAN_NAMESPACES } from "../parser/wasmParser";

export class ImportDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "import",
    name: "Import Detector",
    description: "Categorizes all WASM imports and identifies non-Soroban host function imports",
    category: "host-interface",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    if (contract.imports.length === 0) {
      findings.push({
        detector: this.meta.id,
        title: "No Imports",
        severity: "info",
        description: "Contract has no WASM imports. This is unusual for a Soroban contract.",
        recommendation: "Verify this is a valid Soroban contract.",
        evidence: "Import table is empty",
      });
      return findings;
    }

    // Categorize imports
    const sorobanImports = contract.imports.filter((i) => i.module in SOROBAN_NAMESPACES);
    const unknownImports = contract.imports.filter((i) => !(i.module in SOROBAN_NAMESPACES));

    findings.push({
      detector: this.meta.id,
      title: "Import Summary",
      severity: "info",
      description:
        `${contract.imports.length} total import(s): ` +
        `${sorobanImports.length} Soroban host functions, ` +
        `${unknownImports.length} unknown/non-Soroban imports.`,
      recommendation: "Verify all imports are expected Soroban host functions.",
      evidence: contract.imports.map((i) => i.key).join(", "),
    });

    // Flag unknown imports
    for (const imp of unknownImports) {
      findings.push({
        detector: this.meta.id,
        title: "Non-Soroban Import Detected",
        severity: "medium",
        description:
          `Import '${imp.key}' (module: '${imp.module}') is not a recognized ` +
          `Soroban host function namespace. This may indicate a non-standard ` +
          `or potentially malicious import.`,
        recommendation:
          "Verify this import is expected. Non-Soroban imports may indicate " +
          "a contract compiled with non-standard tooling.",
        evidence: `Unknown import: ${imp.key}`,
      });
    }

    return findings;
  }
}
