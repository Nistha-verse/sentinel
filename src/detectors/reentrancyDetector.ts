import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

export class ReentrancyDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "reentrancy",
    name: "Reentrancy / State Inconsistency Detector",
    description:
      "Detects functions that write state, make a cross-contract call, then write state again — " +
      "a pattern that can leave the contract in an inconsistent state",
    category: "state-management",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    // Note on Soroban reentrancy:
    // Soroban does NOT support traditional reentrancy (no re-entrant execution).
    // However, the pattern: write_state → cross_contract_call → write_state
    // is still dangerous because the cross-contract call can observe intermediate
    // state and the second write may be based on stale assumptions.

    const exportNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
    }

    const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);
    const LEDGER_WRITE_MODULES = new Set(["l", "d"]);
    const CROSS_CONTRACT_MODULES = new Set(["x"]);

    for (const fn of contract.functions) {
      // Only flag functions that have both ledger writes AND cross-contract calls
      if (!fn.hasLedgerWrite || !fn.hasCrossContractCall) continue;

      const exportName = exportNames.get(fn.index);
      if (exportName && RUNTIME_EXPORTS.has(exportName)) continue;

      const label = exportName ?? fn.name;

      // Scan instruction sequence for the pattern:
      // [ledger_write_call] ... [cross_contract_call] ... [ledger_write_call]
      let seenWrite = false;
      let seenCrossCall = false;
      let patternDetected = false;

      for (const instr of fn.instructions) {
        if (instr.id !== "call" || instr.operand === undefined) continue;

        const imp = contract.imports[instr.operand];
        if (!imp) continue;

        if (LEDGER_WRITE_MODULES.has(imp.module)) {
          if (seenCrossCall) {
            // write after cross-contract call — state inconsistency pattern
            patternDetected = true;
            break;
          }
          seenWrite = true;
        } else if (CROSS_CONTRACT_MODULES.has(imp.module)) {
          if (seenWrite) seenCrossCall = true;
        }
      }

      if (patternDetected) {
        findings.push({
          detector: this.meta.id,
          title: "State-Call-State Pattern (Reentrancy Risk)",
          severity: "high",
          description:
            `Function '${label}' writes to ledger storage, then makes a cross-contract ` +
            `call, then writes to ledger storage again. While Soroban prevents true ` +
            `reentrancy, the intermediate cross-contract call can observe inconsistent ` +
            `state, and the second write may be based on stale assumptions if the ` +
            `cross-contract call modifies shared state.`,
          recommendation:
            "Apply the checks-effects-interactions pattern: perform all state writes " +
            "AFTER cross-contract calls complete, or use a reentrancy guard flag in " +
            "storage. Validate all state assumptions after cross-contract calls return.",
          evidence:
            "Instruction sequence: ledger_write → cross_contract_call(x.*) → ledger_write",
          affectedFunction: label,
        });
      } else if (seenWrite && seenCrossCall) {
        // write-then-call pattern without second write — lower severity
        findings.push({
          detector: this.meta.id,
          title: "State Write Before Cross-Contract Call",
          severity: "medium",
          description:
            `Function '${label}' writes to ledger storage before making a cross-contract ` +
            `call. The callee can observe the intermediate state. Ensure this is intentional.`,
          recommendation:
            "Consider moving state writes to after cross-contract calls complete, " +
            "following the checks-effects-interactions pattern.",
          evidence: "ledger_write → cross_contract_call detected in instruction sequence",
          affectedFunction: label,
        });
      }
    }

    return findings;
  }
}
