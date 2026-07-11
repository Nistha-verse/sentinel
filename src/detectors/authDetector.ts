import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

export class AuthDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "auth",
    name: "Authorization Detector",
    description: "Detects exported functions that mutate state without authorization checks",
    category: "access-control",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    // Build a set of exported function indices
    const exportedFuncIndices = new Set<number>();
    const exportedFuncNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null && exp.kind === "Func") {
        exportedFuncIndices.add(exp.funcIndex);
        exportedFuncNames.set(exp.funcIndex, exp.name);
      }
    }

    // Skip internal/runtime exports
    const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);

    for (const fn of contract.functions) {
      const exportName = exportedFuncNames.get(fn.index);
      if (!exportName || RUNTIME_EXPORTS.has(exportName)) continue;

      // Flag: exported function writes to ledger without any auth call in chain
      if (fn.hasLedgerWrite && !fn.hasAuthCall) {
        findings.push({
          detector: this.meta.id,
          title: "Missing Authorization on State-Mutating Function",
          severity: "critical",
          description:
            `Exported function '${exportName}' performs ledger storage writes ` +
            `but no authorization check (require_auth / require_auth_for_args) ` +
            `was found in its call chain.`,
          recommendation:
            "Add env.require_auth(&caller) or env.require_auth_for_args() at the " +
            "start of every function that modifies contract state.",
          evidence: `Function index: ${fn.index}, ledger write detected, no auth import called`,
          affectedFunction: exportName,
        });
      }

      // Flag: exported function with auth-sensitive name but no auth call
      const sensitivePattern = /^(admin|owner|set_|update_|upgrade|transfer|withdraw|mint|burn|pause|unpause)/i;
      if (sensitivePattern.test(exportName) && !fn.hasAuthCall) {
        // Avoid duplicate if already flagged above
        if (!fn.hasLedgerWrite) {
          findings.push({
            detector: this.meta.id,
            title: "Sensitive Function Without Authorization",
            severity: "high",
            description:
              `Exported function '${exportName}' has a privilege-sensitive name ` +
              `but no authorization check was detected in its call chain.`,
            recommendation:
              "Verify that this function enforces caller authorization before executing.",
            evidence: `Function name pattern match: '${exportName}'`,
            affectedFunction: exportName,
          });
        }
      }
    }

    return findings;
  }
}
