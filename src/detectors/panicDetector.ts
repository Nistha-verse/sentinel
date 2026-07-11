import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

export class PanicDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "panic",
    name: "Panic Detector",
    description: "Detects unreachable opcodes that represent Rust panics, unwrap(), or expect() calls",
    category: "reliability",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const exportNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
    }

    const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);

    for (const fn of contract.functions) {
      if (!fn.hasUnreachable) continue;

      const exportName = exportNames.get(fn.index);
      const label = exportName ?? fn.name;

      // Skip runtime/internal functions
      if (exportName && RUNTIME_EXPORTS.has(exportName)) continue;

      // Count unreachable occurrences
      const count = fn.instructions.filter((i) => i.id === "unreachable").length;

      const isExported = exportName !== undefined && !RUNTIME_EXPORTS.has(exportName);
      const severity = isExported ? "medium" : "low";

      findings.push({
        detector: this.meta.id,
        title: "Panic / Trap Opcode Detected",
        severity,
        description:
          `Function '${label}' contains ${count} unreachable opcode(s). ` +
          `In Soroban/WASM, the unreachable opcode is emitted by the Rust compiler ` +
          `for panic!(), unwrap(), expect(), and integer overflow checks. ` +
          `If triggered at runtime, the contract will trap and the transaction will fail.`,
        recommendation:
          "Replace unwrap() and expect() with proper error handling using Result<T, E>. " +
          "Use checked arithmetic (checked_add, checked_mul) instead of operators " +
          "that can overflow. Ensure all code paths are reachable.",
        evidence: `${count} unreachable opcode(s) in function at index ${fn.index}`,
        affectedFunction: label,
      });
    }

    return findings;
  }
}
