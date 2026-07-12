import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

export class CallDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "call",
    name: "Call Graph Detector",
    description: "Detects dynamic dispatch (call_indirect) and recursive call patterns",
    category: "control-flow",
  };

  run(contract: ParsedContract): Finding[] {
    const findings: Finding[] = [];

    const exportNames = new Map<number, string>();
    for (const exp of contract.exports) {
      if (exp.funcIndex !== null) exportNames.set(exp.funcIndex, exp.name);
    }

    for (const fn of contract.functions) {
      if (!fn.hasCallIndirect) continue;
      const label = exportNames.get(fn.index) ?? fn.name;
      findings.push({
        detector: this.meta.id,
        title: "Dynamic Dispatch (call_indirect) Detected",
        severity: "medium",
        confidence: "medium",
        description:
          `Function '${label}' uses call_indirect for dynamic function dispatch. ` +
          `If the function table can be manipulated, this could redirect execution ` +
          `to unintended functions.`,
        recommendation:
          "Verify that the function table is not externally modifiable. " +
          "Prefer direct calls over indirect dispatch where possible.",
        evidence: "call_indirect instruction detected",
        affectedFunction: label,
      });
    }

    const recursive = this.findRecursiveFunctions(contract.callGraph);
    for (const funcIndex of recursive) {
      const fn = contract.functions.find((f) => f.index === funcIndex);
      if (!fn) continue;
      const label = exportNames.get(funcIndex) ?? fn.name;
      findings.push({
        detector: this.meta.id,
        title: "Recursive Function Detected",
        severity: "medium",
        confidence: "high",
        description:
          `Function '${label}' is part of a recursive call cycle. ` +
          `Recursion in Soroban contracts can exhaust the call stack and ` +
          `instruction budget, causing contract failure.`,
        recommendation:
          "Replace recursive algorithms with iterative equivalents. " +
          "If recursion is necessary, add explicit depth limits.",
        evidence: `Function index ${funcIndex} participates in a call graph cycle`,
        affectedFunction: label,
      });
    }

    return findings;
  }

  private findRecursiveFunctions(callGraph: Map<number, Set<number>>): Set<number> {
    const recursive = new Set<number>();
    const visited = new Set<number>();
    const inStack = new Set<number>();

    const dfs = (node: number): void => {
      if (inStack.has(node)) {
        recursive.add(node);
        return;
      }
      if (visited.has(node)) return;

      visited.add(node);
      inStack.add(node);

      const neighbors = callGraph.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          dfs(neighbor);
        }
      }

      inStack.delete(node);
    };

    for (const node of callGraph.keys()) {
      dfs(node);
    }

    return recursive;
  }
}
