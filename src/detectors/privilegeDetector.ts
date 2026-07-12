import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

const ADMIN_PATTERN = /^(set_admin|transfer_admin|set_owner|transfer_ownership|change_admin)/i;
const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);

export class PrivilegeDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "privilege",
    name: "Privilege Escalation Detector",
    description: "Detects admin/owner patterns and potential privilege escalation vulnerabilities",
    category: "access-control",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const exportNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
    }

    for (const fn of contract.functions) {
      const exportName = exportNames.get(fn.index);
      if (!exportName || RUNTIME_EXPORTS.has(exportName)) continue;

      if (ADMIN_PATTERN.test(exportName) && !fn.hasAuthCall) {
        findings.push({
          detector: this.meta.id,
          title: "Admin Transfer Without Authorization",
          severity: "critical",
          confidence: "high",
          description:
            `Function '${exportName}' appears to transfer admin/ownership privileges ` +
            `but no authorization check was detected. Any caller could take over ` +
            `administrative control of the contract.`,
          recommendation:
            "Require the current admin to authorize admin transfers: " +
            "env.require_auth(&current_admin) before updating the admin address.",
          evidence: `Admin transfer function '${exportName}' without auth call`,
          affectedFunction: exportName,
        });
      }

      if (ADMIN_PATTERN.test(exportName) && fn.hasLedgerWrite && !fn.hasLedgerRead) {
        findings.push({
          detector: this.meta.id,
          title: "Admin Set Without Existing Admin Check",
          severity: "high",
          confidence: "medium",
          description:
            `Function '${exportName}' writes an admin/owner address to storage ` +
            `without reading the current admin first. If called before initialization, ` +
            `any caller can claim admin privileges.`,
          recommendation:
            "Check whether an admin is already set before allowing admin assignment. " +
            "Combine admin initialization with the contract initialization guard.",
          evidence: `'${exportName}' writes storage without prior read`,
          affectedFunction: exportName,
        });
      }
    }

    return findings;
  }
}
