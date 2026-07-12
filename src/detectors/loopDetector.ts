import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

const LOOP_DEPTH_WARN = 2;

export class LoopDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "loop",
    name: "Loop Detector",
    description: "Detects unbounded loops and deeply nested loops that risk instruction budget exhaustion",
    category: "resource",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const exportNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
    }

    for (const fn of contract.functions) {
      if (!fn.hasLoop) continue;

      const label = exportNames.get(fn.index) ?? fn.name;

      const hasBrIf = fn.instructions.some((i) => i.id === "br_if");
      const hasReturn = fn.instructions.some((i) => i.id === "return");

      if (!hasBrIf && !hasReturn) {
        findings.push({
          detector: this.meta.id,
          title: "Potentially Unbounded Loop",
          severity: "high",
          confidence: "medium",
          description:
            `Function '${label}' contains a loop block with no conditional branch (br_if) ` +
            `or return instruction detected. This may represent an unbounded loop that ` +
            `exhausts the Soroban instruction budget and causes contract failure.`,
          recommendation:
            "Ensure all loops have a deterministic termination condition. " +
            "Soroban enforces a per-transaction instruction budget — unbounded loops will trap.",
          evidence: `Loop depth: ${fn.loopDepth}, br_if: false, return: false`,
          affectedFunction: label,
        });
      } else if (fn.loopDepth >= LOOP_DEPTH_WARN) {
        findings.push({
          detector: this.meta.id,
          title: "Deeply Nested Loop",
          severity: "medium",
          confidence: "medium",
          description:
            `Function '${label}' has a loop nesting depth of ${fn.loopDepth}. ` +
            `Deeply nested loops multiply instruction consumption and may exhaust ` +
            `the Soroban instruction budget under adversarial inputs.`,
          recommendation:
            "Refactor deeply nested loops. Consider bounding iteration counts " +
            "with explicit limits to prevent budget exhaustion.",
          evidence: `Loop nesting depth: ${fn.loopDepth}`,
          affectedFunction: label,
        });
      }
    }

    return findings;
  }
}
