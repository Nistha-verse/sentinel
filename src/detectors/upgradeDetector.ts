import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

const UPGRADE_FUNC_PATTERN = /^(upgrade|update|migrate|set_wasm)/i;

export class UpgradeDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "upgrade",
    name: "Upgrade Detector",
    description: "Detects contract upgrade patterns and verifies authorization is enforced",
    category: "access-control",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    // update_current_contract_wasm is in the 'e' (events/env) or 'n' (context) namespace
    const upgradeImports = contract.imports.filter(
      (imp) => imp.module === "e" || imp.module === "n"
    );

    if (upgradeImports.length === 0) return findings;

    const exportNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
    }

    for (const fn of contract.functions) {
      const callsUpgrade = fn.instructions.some(
        (instr) =>
          instr.id === "call" &&
          instr.operand !== undefined &&
          upgradeImports.some((imp) => imp.funcIndex === instr.operand)
      );

      if (!callsUpgrade) continue;

      const exportName = exportNames.get(fn.index);
      const label = exportName ?? fn.name;

      if (!fn.hasAuthCall) {
        findings.push({
          detector: this.meta.id,
          title: "Contract Upgrade Without Authorization",
          severity: "critical",
          confidence: "high",
          description:
            `Function '${label}' calls a contract upgrade host function ` +
            `but no authorization check (require_auth) was detected in its call chain. ` +
            `Any caller could upgrade the contract to arbitrary WASM code.`,
          recommendation:
            "Add env.require_auth(&admin) before any upgrade operation. " +
            "Verify the caller is the designated admin stored in contract state.",
          evidence: `Upgrade host function call detected without auth in '${label}'`,
          affectedFunction: label,
        });
      }

      if (exportName && !UPGRADE_FUNC_PATTERN.test(exportName)) {
        findings.push({
          detector: this.meta.id,
          title: "Upgrade Capability in Non-Upgrade Function",
          severity: "high",
          confidence: "medium",
          description:
            `Function '${exportName}' performs a contract upgrade but its name ` +
            `does not indicate upgrade intent. This may be an obfuscated upgrade path.`,
          recommendation:
            "Ensure upgrade functions are clearly named and documented. " +
            "Consider using a dedicated upgrade function with explicit access control.",
          evidence: `Function '${exportName}' calls upgrade host function`,
          affectedFunction: exportName,
        });
      }
    }

    return findings;
  }
}
