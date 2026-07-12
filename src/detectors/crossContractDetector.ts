import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";
import { INVOKE_CONTRACT_NAMES } from "../parser/wasmParser";

const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);

export class CrossContractDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "cross-contract",
    name: "Cross-Contract Call Detector",
    description: "Detects invoke_contract calls and potential dynamic address injection",
    category: "external-interaction",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    // Only care about genuine invoke_contract imports (x.0 = call, x.1 = try_call)
    const invokeImports = contract.imports.filter(
      (imp) => imp.module === "x" && INVOKE_CONTRACT_NAMES.has(imp.name)
    );

    if (invokeImports.length === 0) return findings;

    const exportNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
    }

    for (const fn of contract.functions) {
      if (fn.invokeContractCount === 0) continue;

      const exportName = exportNames.get(fn.index);
      if (exportName && RUNTIME_EXPORTS.has(exportName)) continue;

      const label = exportName ?? fn.name;

      // Dynamic address: storage read before invoke_contract suggests address loaded from storage
      const dynamicAddress = this.hasStorageReadBeforeInvoke(fn.instructions, contract);

      if (dynamicAddress) {
        findings.push({
          detector: this.meta.id,
          title: "Cross-Contract Call with Dynamic Address",
          severity: "medium",
          confidence: "medium",
          description:
            `Function '${label}' reads from storage then invokes an external contract. ` +
            `The callee address may be loaded from storage. If that address can be ` +
            `modified by an unauthorized party, this enables arbitrary contract invocation.`,
          recommendation:
            "Ensure the stored callee address can only be set by an authorized admin. " +
            "Validate the callee address before invoking.",
          evidence: "storage_read(d.0/d._) → invoke_contract(x.0/x.1) sequence detected",
          affectedFunction: label,
        });
      } else {
        findings.push({
          detector: this.meta.id,
          title: "Cross-Contract Call Detected",
          severity: "info",
          confidence: "high",
          description:
            `Function '${label}' invokes an external contract. ` +
            `Verify the callee is trusted and call arguments are validated.`,
          recommendation:
            "Ensure cross-contract call targets are trusted. " +
            "Handle failure cases from try_call appropriately.",
          evidence: `invoke_contract (x.0/x.1) detected, count: ${fn.invokeContractCount}`,
          affectedFunction: label,
        });
      }
    }

    return findings;
  }

  private hasStorageReadBeforeInvoke(
    instructions: Array<{ id: string; operand?: number }>,
    contract: ParsedContract
  ): boolean {
    let seenRead = false;
    for (const instr of instructions) {
      if (instr.id !== "call" || instr.operand === undefined) continue;
      const imp = contract.imports[instr.operand];
      if (!imp) continue;
      if (imp.module === "d" && (imp.name === "0" || imp.name === "_")) seenRead = true;
      if (imp.module === "x" && INVOKE_CONTRACT_NAMES.has(imp.name) && seenRead) return true;
    }
    return false;
  }
}
