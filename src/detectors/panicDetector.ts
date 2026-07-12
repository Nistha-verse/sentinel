import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);

// Compiler-generated internal function name patterns (Rust/LLVM artifacts)
const COMPILER_FUNC_PATTERN = /^(rust_begin_unwind|__rust_|_ZN|panic_|core::panicking|alloc::)/;

export class PanicDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "panic",
    name: "Panic Detector",
    description: "Detects unreachable opcodes representing Rust panics in exported functions",
    category: "reliability",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const exportNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
    }

    for (const fn of contract.functions) {
      if (!fn.hasUnreachable) continue;

      const exportName = exportNames.get(fn.index);
      if (exportName && RUNTIME_EXPORTS.has(exportName)) continue;

      // Skip known compiler-generated internal functions
      if (COMPILER_FUNC_PATTERN.test(fn.name)) continue;

      const isExported = exportName !== undefined;
      const label = exportName ?? fn.name;
      const count = fn.unreachableCount;

      if (isExported) {
        if (count > 2) {
          // Multiple unreachable in an exported function strongly suggests
          // explicit unwrap()/expect()/panic!() calls beyond compiler overflow checks
          findings.push({
            detector: this.meta.id,
            title: "Panic Risk in Exported Function",
            severity: "medium",
            confidence: "medium",
            description:
              `Exported function '${label}' contains ${count} unreachable opcode(s). ` +
              `In Soroban/WASM, unreachable is emitted by the Rust compiler for ` +
              `panic!(), unwrap(), expect(), and integer overflow checks. ` +
              `If triggered, the transaction will fail.`,
            recommendation:
              "Replace unwrap() and expect() with proper error handling using Result<T, E>. " +
              "Use checked arithmetic (checked_add, checked_mul) to prevent overflow panics.",
            evidence: `${count} unreachable opcode(s) in exported function '${label}' (index ${fn.index})`,
            affectedFunction: label,
          });
        } else {
          // 1–2 unreachable is typical compiler output (overflow checks, etc.)
          // Flag as low/low — informational for completeness
          findings.push({
            detector: this.meta.id,
            title: "Compiler Overflow Check in Exported Function",
            severity: "low",
            confidence: "low",
            description:
              `Exported function '${label}' contains ${count} unreachable opcode(s), ` +
              `consistent with compiler-generated integer overflow checks. ` +
              `These are standard in Rust debug/release builds.`,
            recommendation:
              "Use checked arithmetic (checked_add, checked_mul) to eliminate " +
              "overflow panics if strict reliability is required.",
            evidence: `${count} unreachable opcode(s) in '${label}' (index ${fn.index})`,
            affectedFunction: label,
          });
        }
      }
    }

    return findings;
  }
}
