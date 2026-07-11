import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";
import { SOROBAN_NAMESPACES } from "../parser/wasmParser";

export class HostFunctionDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "host-function",
    name: "Host Function Detector",
    description: "Enumerates Soroban host function imports and flags dangerous usage patterns",
    category: "host-interface",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const sorobanImports = contract.imports.filter(
      (imp) => imp.module in SOROBAN_NAMESPACES
    );

    if (sorobanImports.length === 0) {
      findings.push({
        detector: this.meta.id,
        title: "No Soroban Host Functions Detected",
        severity: "info",
        description:
          "No recognized Soroban host function imports were found. " +
          "This may indicate a non-Soroban WASM or a heavily optimized contract.",
        recommendation: "Verify this is a valid Soroban contract.",
        evidence: `Total imports: ${contract.imports.length}`,
      });
      return findings;
    }

    // Summarize host function categories
    const categories = new Map<string, number>();
    for (const imp of sorobanImports) {
      categories.set(imp.category, (categories.get(imp.category) ?? 0) + 1);
    }

    findings.push({
      detector: this.meta.id,
      title: "Soroban Host Function Summary",
      severity: "info",
      description:
        `Contract uses ${sorobanImports.length} Soroban host function(s) across ` +
        `${categories.size} namespace(s): ` +
        Array.from(categories.entries())
          .map(([cat, count]) => `${cat}(${count})`)
          .join(", "),
      recommendation: "Review all host function imports for intended usage.",
      evidence: sorobanImports.map((i) => i.key).join(", "),
    });

    // Flag: crypto host functions (potential misuse)
    const cryptoImports = sorobanImports.filter((imp) => imp.module === "c");
    if (cryptoImports.length > 0) {
      findings.push({
        detector: this.meta.id,
        title: "Cryptographic Host Functions Used",
        severity: "info",
        description:
          `Contract uses ${cryptoImports.length} cryptographic host function(s): ` +
          cryptoImports.map((i) => i.key).join(", ") +
          ". Verify cryptographic operations are used correctly.",
        recommendation:
          "Ensure hash functions are used for integrity, not as a substitute for " +
          "authorization. Verify signature verification uses the correct key.",
        evidence: cryptoImports.map((i) => i.key).join(", "),
      });
    }

    // Flag: event emission without auth (silent operations)
    const eventImports = sorobanImports.filter((imp) => imp.module === "e");
    if (eventImports.length > 0) {
      // Check if any function emits events without auth
      const exportNames = new Map<number, string>();
      for (const exp of contract.exports) {
        if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
      }

      for (const fn of contract.functions) {
        const callsEvent = fn.instructions.some(
          (i) =>
            i.id === "call" &&
            i.operand !== undefined &&
            eventImports.some((imp) => imp.funcIndex === i.operand)
        );
        if (callsEvent && !fn.hasAuthCall) {
          const label = exportNames.get(fn.index) ?? fn.name;
          findings.push({
            detector: this.meta.id,
            title: "Event Emission Without Authorization",
            severity: "low",
            description:
              `Function '${label}' emits contract events without an authorization check. ` +
              `Unauthorized event emission can be used to spam the event log or ` +
              `mislead off-chain indexers.`,
            recommendation:
              "Ensure event-emitting functions require appropriate authorization " +
              "or are only callable by trusted parties.",
            evidence: `Event host function call in '${label}' without auth`,
            affectedFunction: label,
          });
          break; // one finding per contract is sufficient
        }
      }
    }

    return findings;
  }
}
