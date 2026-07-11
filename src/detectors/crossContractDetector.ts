import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

export class CrossContractDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "cross-contract",
    name: "Cross-Contract Call Detector",
    description: "Detects cross-contract calls and potential dynamic address injection vulnerabilities",
    category: "external-interaction",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const crossContractImports = contract.imports.filter(
      (imp) => imp.module === "x"
    );

    if (crossContractImports.length === 0) return findings;

    const exportNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
    }

    const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);

    for (const fn of contract.functions) {
      if (!fn.hasCrossContractCall) continue;

      const exportName = exportNames.get(fn.index);
      if (exportName && RUNTIME_EXPORTS.has(exportName)) continue;

      const label = exportName ?? fn.name;

      // Cross-contract call with ledger read before it suggests dynamic address
      // (address loaded from storage, then used in cross-contract call)
      const hasLedgerReadBeforeCall = this.hasLedgerReadBeforeCrossCall(
        fn.instructions,
        contract
      );

      if (hasLedgerReadBeforeCall) {
        findings.push({
          detector: this.meta.id,
          title: "Cross-Contract Call with Dynamic Address",
          severity: "medium",
          description:
            `Function '${label}' reads from ledger storage and then makes a ` +
            `cross-contract call. The callee address may be loaded from storage, ` +
            `creating a dynamic dispatch pattern. If the stored address can be ` +
            `modified by an unauthorized party, this enables arbitrary contract invocation.`,
          recommendation:
            "Ensure the stored callee address can only be set by an authorized admin. " +
            "Consider hardcoding trusted contract addresses where possible. " +
            "Validate the callee address before invoking.",
          evidence: "ledger_read → cross_contract_call sequence detected",
          affectedFunction: label,
        });
      } else {
        findings.push({
          detector: this.meta.id,
          title: "Cross-Contract Call Detected",
          severity: "info",
          description:
            `Function '${label}' makes a cross-contract call. ` +
            `Verify the callee contract is trusted and the call arguments are validated.`,
          recommendation:
            "Ensure cross-contract call targets are trusted. " +
            "Handle failure cases from try_call appropriately.",
          evidence: "x.* host function call detected",
          affectedFunction: label,
        });
      }
    }

    return findings;
  }

  private hasLedgerReadBeforeCrossCall(
    instructions: Array<{ id: string; operand?: number }>,
    contract: ParsedContract
  ): boolean {
    let seenRead = false;
    for (const instr of instructions) {
      if (instr.id !== "call" || instr.operand === undefined) continue;
      const imp = contract.imports[instr.operand];
      if (!imp) continue;
      if (imp.module === "l" || imp.module === "d") seenRead = true;
      if (imp.module === "x" && seenRead) return true;
    }
    return false;
  }
}
