import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

export class MemoryDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "memory",
    name: "Memory Detector",
    description: "Detects exported linear memory and dynamic memory growth operations",
    category: "memory",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    // Exported memory is standard and required by the Soroban ABI for host-guest
    // data exchange. Flag as info only — not a vulnerability.
    const memoryExport = contract.exports.find(
      (e) => e.name === "memory" && e.kind === "Mem"
    );
    if (memoryExport) {
      findings.push({
        detector: this.meta.id,
        title: "Linear Memory Exported (Standard Soroban ABI)",
        severity: "info",
        confidence: "high",
        description:
          "The contract exports its linear memory section. " +
          "This is required by the Soroban host ABI for host-guest data exchange " +
          "and is present in all standard Soroban contracts.",
        recommendation:
          "No action required. Ensure no sensitive data (private keys, secrets) " +
          "is stored in linear memory at rest.",
        evidence: "Export 'memory' of kind Mem found",
      });
    }

    const exportNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
    }

    for (const fn of contract.functions) {
      if (!fn.hasMemoryGrow) continue;
      const label = exportNames.get(fn.index) ?? fn.name;
      findings.push({
        detector: this.meta.id,
        title: "Dynamic Memory Growth Detected",
        severity: "low",
        confidence: "high",
        description:
          `Function '${label}' uses the memory.grow instruction to dynamically ` +
          `expand linear memory. Unbounded memory growth can exhaust resources ` +
          `and cause contract failure.`,
        recommendation:
          "Ensure memory growth is bounded. Validate allocation sizes before " +
          "calling memory.grow to prevent resource exhaustion.",
        evidence: "memory.grow instruction detected",
        affectedFunction: label,
      });
    }

    return findings;
  }
}
