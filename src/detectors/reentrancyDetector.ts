import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";
import { INVOKE_CONTRACT_NAMES } from "../parser/wasmParser";

const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);

export class ReentrancyDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "reentrancy",
    name: "Reentrancy / State Inconsistency Detector",
    description:
      "Detects functions that write state, make an invoke_contract call, then write state again",
    category: "state-management",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const exportNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
    }

    for (const fn of contract.functions) {
      // Require both a genuine storage write AND a genuine invoke_contract call
      if (!fn.hasLedgerWrite || fn.invokeContractCount === 0) continue;

      const exportName = exportNames.get(fn.index);
      if (exportName && RUNTIME_EXPORTS.has(exportName)) continue;

      const label = exportName ?? fn.name;

      // Scan instruction sequence for: storage_write → invoke_contract → storage_write
      let seenWrite = false;
      let seenInvoke = false;
      let patternDetected = false;

      for (const instr of fn.instructions) {
        if (instr.id !== "call" || instr.operand === undefined) continue;
        const imp = contract.imports[instr.operand];
        if (!imp) continue;

        if (imp.module === "d" && (imp.name === "1" || imp.name === "2")) {
          // storage write (d.1 = set, d.2 = del)
          if (seenInvoke) {
            patternDetected = true;
            break;
          }
          seenWrite = true;
        } else if (imp.module === "x" && INVOKE_CONTRACT_NAMES.has(imp.name)) {
          // genuine invoke_contract (x.0 = call, x.1 = try_call)
          if (seenWrite) seenInvoke = true;
        }
      }

      if (patternDetected) {
        findings.push({
          detector: this.meta.id,
          title: "State-Call-State Pattern (Reentrancy Risk)",
          severity: "high",
          confidence: "high",
          description:
            `Function '${label}' writes to storage, then invokes an external contract, ` +
            `then writes to storage again. While Soroban prevents true reentrancy, ` +
            `the intermediate cross-contract call can observe inconsistent state and ` +
            `the second write may be based on stale assumptions.`,
          recommendation:
            "Apply checks-effects-interactions: perform all state writes AFTER " +
            "cross-contract calls complete, or validate all state assumptions after " +
            "the external call returns.",
          evidence:
            "Instruction sequence: storage_write(d.1/d.2) → invoke_contract(x.0/x.1) → storage_write",
          affectedFunction: label,
        });
      } else if (seenWrite && seenInvoke) {
        findings.push({
          detector: this.meta.id,
          title: "State Write Before Cross-Contract Call",
          severity: "low",
          confidence: "medium",
          description:
            `Function '${label}' writes to storage before invoking an external contract. ` +
            `The callee can observe the intermediate state. Ensure this is intentional.`,
          recommendation:
            "Consider moving state writes to after cross-contract calls complete.",
          evidence: "storage_write(d.1/d.2) → invoke_contract(x.0/x.1) detected",
          affectedFunction: label,
        });
      }
    }

    return findings;
  }
}
