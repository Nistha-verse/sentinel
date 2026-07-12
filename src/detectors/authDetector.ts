import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);
const SENSITIVE_PATTERN = /^(admin|owner|set_|update_|upgrade|transfer|withdraw|mint|burn|pause|unpause)/i;

export class AuthDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "auth",
    name: "Authorization Detector",
    description: "Detects exported functions that mutate state without authorization checks",
    category: "access-control",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const exportedFuncNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null && exp.kind === "Func") {
        exportedFuncNames.set(exp.funcIndex, exp.name);
      }
    }

    for (const fn of contract.functions) {
      const exportName = exportedFuncNames.get(fn.index);
      if (!exportName || RUNTIME_EXPORTS.has(exportName)) continue;

      // Only flag functions that actually write storage (d.1 / d.2)
      // Read-only functions (d.0 / d._ / l.*) must never be flagged here
      if (fn.hasLedgerWrite && !fn.hasAuthCall) {
        findings.push({
          detector: this.meta.id,
          title: "Missing Authorization on State-Mutating Function",
          severity: "critical",
          confidence: "high",
          description:
            `Exported function '${exportName}' writes to contract storage ` +
            `but no authorization check (require_auth / require_auth_for_args) ` +
            `was found in its call chain.`,
          recommendation:
            "Add env.require_auth(&caller) or env.require_auth_for_args() at the " +
            "start of every function that modifies contract state.",
          evidence: `Function index ${fn.index}: storage write (d.1/d.2) detected, no a.* auth import called`,
          affectedFunction: exportName,
        });
      } else if (SENSITIVE_PATTERN.test(exportName) && !fn.hasAuthCall && !fn.hasLedgerWrite) {
        // Sensitive name but no write detected — lower confidence
        findings.push({
          detector: this.meta.id,
          title: "Sensitive Function Without Authorization",
          severity: "medium",
          confidence: "low",
          description:
            `Exported function '${exportName}' has a privilege-sensitive name ` +
            `but no authorization check was detected in its call chain.`,
          recommendation:
            "Verify that this function enforces caller authorization before executing.",
          evidence: `Function name matches sensitive pattern: '${exportName}'`,
          affectedFunction: exportName,
        });
      }
    }

    return findings;
  }
}
