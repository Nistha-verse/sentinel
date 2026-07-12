import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);
const SUSPICIOUS_PATTERN = /^(debug|test_|_test|backdoor|dev_|internal_)/i;

export class ExportDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "export",
    name: "Export Detector",
    description: "Analyzes exported entrypoints for suspicious or unexpected patterns",
    category: "surface-area",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const funcExports = contract.exports.filter(
      (e) => e.kind === "Func" && !RUNTIME_EXPORTS.has(e.name)
    );

    // Suspicious export names (debug/test/backdoor)
    for (const exp of funcExports) {
      if (SUSPICIOUS_PATTERN.test(exp.name)) {
        findings.push({
          detector: this.meta.id,
          title: "Suspicious Export Name",
          severity: "high",
          confidence: "medium",
          description:
            `Export '${exp.name}' has a name suggesting it may be a debug, test, ` +
            `or backdoor function that should not be publicly accessible in production.`,
          recommendation:
            "Remove debug/test functions before deploying to mainnet. " +
            "Ensure no development backdoors are left in production contracts.",
          evidence: `Export name '${exp.name}' matches suspicious pattern`,
          affectedFunction: exp.name,
        });
      }
    }

    // Large attack surface
    if (funcExports.length > 15) {
      findings.push({
        detector: this.meta.id,
        title: "Large Public Attack Surface",
        severity: "low",
        confidence: "high",
        description:
          `Contract exports ${funcExports.length} public functions. ` +
          `A large number of public entrypoints increases the attack surface.`,
        recommendation:
          "Review whether all exported functions need to be public. " +
          "Consider making internal helper functions private.",
        evidence: `${funcExports.length} exported functions`,
      });
    }

    return findings;
  }
}
