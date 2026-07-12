import type { IDetector, DetectorMeta } from "./IDetector";
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

const EXCESSIVE_STORAGE_OPS = 10;
const RUNTIME_EXPORTS = new Set(["memory", "__data_end", "__heap_base", "_"]);
const INIT_PATTERN = /^(initialize|init|setup|constructor)/i;

export class StorageDetector implements IDetector {
  readonly meta: DetectorMeta = {
    id: "storage",
    name: "Storage Detector",
    description: "Detects unsafe storage patterns: reinitialization risk and excessive storage operations",
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
      if (exportName && RUNTIME_EXPORTS.has(exportName)) continue;

      const label = exportName ?? fn.name;

      const storageCallCount = fn.instructions.filter(
        (i) =>
          i.id === "call" &&
          i.operand !== undefined &&
          contract.imports[i.operand] !== undefined &&
          (contract.imports[i.operand]!.module === "l" ||
            contract.imports[i.operand]!.module === "d")
      ).length;

      if (exportName && INIT_PATTERN.test(exportName)) {
        const hasReadBeforeWrite = this.hasReadBeforeWrite(fn.instructions, contract);

        if (!hasReadBeforeWrite && fn.hasLedgerWrite) {
          findings.push({
            detector: this.meta.id,
            title: "Missing Reinitialization Guard",
            severity: "critical",
            confidence: "high",
            description:
              `Initialization function '${exportName}' writes to storage without ` +
              `first checking whether the contract has already been initialized. ` +
              `Any caller can reinitialize the contract, overwriting existing state ` +
              `including admin addresses and configuration.`,
            recommendation:
              "Add an initialization guard: read a sentinel key from storage at the " +
              "start of the init function and panic/return-error if it already exists. " +
              "Example: if env.storage().instance().has(&DataKey::Initialized) { panic!(\"already initialized\") }",
            evidence: `No storage read (d.0/d._) before first storage write (d.1) in '${exportName}'`,
            affectedFunction: exportName,
          });
        }
      }

      if (storageCallCount > EXCESSIVE_STORAGE_OPS) {
        findings.push({
          detector: this.meta.id,
          title: "Excessive Storage Operations",
          severity: "low",
          confidence: "high",
          description:
            `Function '${label}' performs ${storageCallCount} storage operations. ` +
            `Excessive storage reads/writes increase ledger fees and may approach ` +
            `resource limits under certain conditions.`,
          recommendation:
            "Cache frequently accessed storage values in local variables. " +
            "Batch storage operations where possible.",
          evidence: `${storageCallCount} ledger/storage host function calls detected`,
          affectedFunction: label,
        });
      }
    }

    return findings;
  }

  private hasReadBeforeWrite(
    instructions: Array<{ id: string; operand?: number }>,
    contract: ParsedContract
  ): boolean {
    for (const instr of instructions) {
      if (instr.id !== "call" || instr.operand === undefined) continue;
      const imp = contract.imports[instr.operand];
      if (!imp || imp.module !== "d") continue;
      if (imp.name === "0" || imp.name === "_") return true;  // read/has before write
      if (imp.name === "1" || imp.name === "2") return false; // write found first
    }
    return false;
  }
}
