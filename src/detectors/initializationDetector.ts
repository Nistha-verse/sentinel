import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

const INIT_PATTERN = /^(initialize|init|setup|constructor)/i;
const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);

export class InitializationDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "initialization",
    name: "Initialization Detector",
    description: "Detects missing re-initialization guards that allow contracts to be re-initialized",
    category: "state-management",
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
      if (!INIT_PATTERN.test(exportName)) continue;

      const hasExistenceCheck = fn.instructions.some((instr) => {
        if (instr.id !== "call" || instr.operand === undefined) return false;
        const imp = contract.imports[instr.operand];
        if (!imp) return false;
        return imp.module === "d" && (imp.name === "_" || imp.name === "0");
      });

      if (!hasExistenceCheck && fn.hasLedgerWrite) {
        findings.push({
          detector: this.meta.id,
          title: "Re-Initialization Vulnerability",
          severity: "critical",
          confidence: "high",
          description:
            `Initialization function '${exportName}' does not check whether the ` +
            `contract has already been initialized before writing state. ` +
            `Any caller can invoke this function multiple times, overwriting ` +
            `the admin address, configuration, and all contract state.`,
          recommendation:
            "Add a guard at the start of the init function:\n" +
            "  if env.storage().instance().has(&DataKey::Initialized) {\n" +
            "      panic!(\"Contract already initialized\");\n" +
            "  }\n" +
            "  env.storage().instance().set(&DataKey::Initialized, &true);",
          evidence: `No storage existence check (d._ / d.0) before first write (d.1) in '${exportName}'`,
          affectedFunction: exportName,
        });
      }
    }

    return findings;
  }
}
