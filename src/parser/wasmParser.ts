import * as fs from "fs";
import { decode } from "@webassemblyjs/wasm-parser";
import { traverse } from "@webassemblyjs/ast";
import type {
  Program,
  ModuleImport,
  ModuleExport,
  Func,
  Instr,
  CustomSection,
} from "@webassemblyjs/ast";

// ─── Soroban host function namespace map ─────────────────────────────────────
export const SOROBAN_NAMESPACES: Record<string, string> = {
  l: "ledger",
  a: "auth",
  x: "cross_contract",
  d: "contract_data",
  e: "events",
  m: "memory",
  b: "buffer",
  i: "integer",
  c: "crypto",
  s: "string",
  v: "value",
  p: "prng",
  r: "result",
  u: "address",
  n: "context",
  f: "float",
};

export const AUTH_IMPORT_PATTERN = /^a\./;
export const LEDGER_WRITE_PATTERN = /^[ld]\./;
export const CROSS_CONTRACT_PATTERN = /^x\./;

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface ImportInfo {
  module: string;
  name: string;
  category: string;
  key: string;
  funcIndex: number;
}

export interface ExportInfo {
  name: string;
  kind: string;
  funcIndex: number | null;
}

export interface InstructionRecord {
  id: string;
  operand?: number;
}

export interface FunctionInfo {
  index: number;
  name: string;
  instructions: InstructionRecord[];
  callTargets: Set<number>;
  hasLoop: boolean;
  loopDepth: number;
  hasUnreachable: boolean;
  hasCrossContractCall: boolean;
  hasAuthCall: boolean;
  hasLedgerWrite: boolean;
  hasLedgerRead: boolean;
  hasCallIndirect: boolean;
  hasMemoryGrow: boolean;
}

export interface ParsedContract {
  raw: Buffer;
  importFuncCount: number;
  functions: FunctionInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  callGraph: Map<number, Set<number>>;
  customSections: CustomSection[];
  contractName: string | null;
}

// ─── AST node shapes as seen at runtime ──────────────────────────────────────
// @webassemblyjs stores call targets in node.index, not node.args[0]
interface RuntimeCallInstr {
  id: "call";
  index?: { value: number };
  args?: Array<{ value?: number }>;
}

interface RuntimeBlockInstr {
  id: "block" | "loop";
  instr?: RuntimeInstr[];
}

interface RuntimeIfInstr {
  id: "if";
  consequent?: RuntimeInstr[];
  alternate?: RuntimeInstr[];
}

interface RuntimeInstr {
  id: string;
  index?: { value: number };
  args?: Array<{ value?: number }>;
  instr?: RuntimeInstr[];
  consequent?: RuntimeInstr[];
  alternate?: RuntimeInstr[];
}

// ─── Instruction extraction ───────────────────────────────────────────────────

function flattenInstructions(bodyValues: RuntimeInstr[]): InstructionRecord[] {
  const result: InstructionRecord[] = [];

  function walk(list: RuntimeInstr[]): void {
    for (const instr of list) {
      if (!instr || !instr.id) continue;

      const rec: InstructionRecord = { id: instr.id };

      // call uses node.index.value (CallInstruction shape)
      if (instr.id === "call" && instr.index !== undefined) {
        rec.operand = instr.index.value;
      }

      result.push(rec);

      // Recurse into block/loop bodies (stored in node.instr)
      if ((instr.id === "block" || instr.id === "loop") && Array.isArray(instr.instr)) {
        walk(instr.instr);
      } else if (instr.id === "if") {
        if (Array.isArray(instr.consequent)) walk(instr.consequent);
        if (Array.isArray(instr.alternate)) walk(instr.alternate);
      }
    }
  }

  walk(bodyValues);
  return result;
}

function computeLoopDepth(bodyValues: RuntimeInstr[]): number {
  let maxDepth = 0;

  function walk(list: RuntimeInstr[], depth: number): void {
    for (const instr of list) {
      if (!instr) continue;
      if (instr.id === "loop") {
        maxDepth = Math.max(maxDepth, depth + 1);
        if (Array.isArray(instr.instr)) walk(instr.instr, depth + 1);
      } else if (instr.id === "block") {
        if (Array.isArray(instr.instr)) walk(instr.instr, depth);
      } else if (instr.id === "if") {
        if (Array.isArray(instr.consequent)) walk(instr.consequent, depth);
        if (Array.isArray(instr.alternate)) walk(instr.alternate, depth);
      }
    }
  }

  walk(bodyValues, 0);
  return maxDepth;
}

// ─── Contract name extraction ─────────────────────────────────────────────────

function extractContractName(sections: CustomSection[]): string | null {
  const metaSection = sections.find(
    (s) => s.name === "contractmetav0" || s.name === "contractenv"
  );
  if (!metaSection) return null;

  try {
    const buf = Buffer.from(metaSection.data);
    const text = buf.toString("utf8");
    const matches = text.match(/[\x20-\x7E]{3,}/g);
    if (matches) {
      const name = matches.find(
        (m) =>
          !m.startsWith("rsver") &&
          !m.startsWith("rssdkver") &&
          m.length >= 3 &&
          m.length <= 64
      );
      return name ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseWasm(filePath: string): ParsedContract {
  const raw = fs.readFileSync(filePath);

  const ast = decode(raw, {
    ignoreCodeSection: false,
    ignoreDataSection: false,
  }) as Program;

  const imports: ImportInfo[] = [];
  const exportList: ExportInfo[] = [];
  const rawFuncs: Array<{ name: string; body: RuntimeInstr[] }> = [];
  const customSections: CustomSection[] = [];

  // ── Collect custom sections directly from AST module fields ───────────────
  // traverse() does not support CustomSection as a visitor key at runtime
  for (const wasmModule of ast.body) {
    for (const field of wasmModule.fields) {
      if (field.type === "CustomSection") {
        customSections.push(field as CustomSection);
      }
    }
  }

  // ── Traverse: imports, exports, functions ─────────────────────────────────
  traverse(ast, {
    ModuleImport(p: { node: ModuleImport }) {
      const node = p.node;
      if (node.descr.type !== "FuncImportDescr") return;
      const category = SOROBAN_NAMESPACES[node.module] ?? `unknown(${node.module})`;
      imports.push({
        module: node.module,
        name: node.name,
        category,
        key: `${node.module}.${node.name}`,
        funcIndex: imports.length,
      });
    },

    ModuleExport(p: { node: ModuleExport }) {
      const node = p.node;
      let funcIndex: number | null = null;
      if (node.descr.exportType === "Func") {
        const id = node.descr.id;
        if ("value" in id && typeof id.value === "number") {
          funcIndex = id.value;
        }
      }
      exportList.push({ name: node.name, kind: node.descr.exportType, funcIndex });
    },

    Func(p: { node: Func }) {
      const node = p.node;
      if (node.isExternal) return;
      const name = node.name?.value ?? `func_${imports.length + rawFuncs.length}`;
      // body is an array-like object with numeric keys — use Object.values()
      const body = node.body
        ? (Object.values(node.body) as RuntimeInstr[])
        : [];
      rawFuncs.push({ name, body });
    },
  } as unknown as import("@webassemblyjs/ast").TraversalHandlers);

  const importFuncCount = imports.length;

  // ── Build FunctionInfo with instruction analysis ───────────────────────────
  const functions: FunctionInfo[] = rawFuncs.map((raw, localIdx) => {
    const index = importFuncCount + localIdx;
    const instructions = flattenInstructions(raw.body);
    const callTargets = new Set<number>();

    let hasLoop = false;
    let hasUnreachable = false;
    let hasCrossContractCall = false;
    let hasAuthCall = false;
    let hasLedgerWrite = false;
    let hasLedgerRead = false;
    let hasCallIndirect = false;
    let hasMemoryGrow = false;

    for (const instr of instructions) {
      switch (instr.id) {
        case "loop":
          hasLoop = true;
          break;
        case "unreachable":
          hasUnreachable = true;
          break;
        case "call_indirect":
          hasCallIndirect = true;
          break;
        case "memory.grow":
          hasMemoryGrow = true;
          break;
        case "call":
          if (instr.operand !== undefined) {
            callTargets.add(instr.operand);
            const imp = imports[instr.operand];
            if (imp) {
              if (AUTH_IMPORT_PATTERN.test(imp.key)) hasAuthCall = true;
              if (CROSS_CONTRACT_PATTERN.test(imp.key)) hasCrossContractCall = true;
              if (LEDGER_WRITE_PATTERN.test(imp.key)) {
                hasLedgerWrite = true;
                hasLedgerRead = true;
              }
            }
          }
          break;
      }
    }

    const loopDepth = computeLoopDepth(raw.body);

    return {
      index,
      name: raw.name,
      instructions,
      callTargets,
      hasLoop,
      loopDepth,
      hasUnreachable,
      hasCrossContractCall,
      hasAuthCall,
      hasLedgerWrite,
      hasLedgerRead,
      hasCallIndirect,
      hasMemoryGrow,
    };
  });

  // ── Build call graph ───────────────────────────────────────────────────────
  const callGraph = new Map<number, Set<number>>();
  for (const fn of functions) {
    callGraph.set(fn.index, fn.callTargets);
  }

  // ── Propagate flags through call graph (2 passes) ─────────────────────────
  for (let pass = 0; pass < 2; pass++) {
    for (const fn of functions) {
      for (const target of fn.callTargets) {
        const callee = functions.find((f) => f.index === target);
        if (!callee) continue;
        if (callee.hasAuthCall) fn.hasAuthCall = true;
        if (callee.hasLedgerWrite) fn.hasLedgerWrite = true;
        if (callee.hasLedgerRead) fn.hasLedgerRead = true;
        if (callee.hasCrossContractCall) fn.hasCrossContractCall = true;
      }
    }
  }

  const contractName = extractContractName(customSections);

  return {
    raw,
    importFuncCount,
    functions,
    imports,
    exports: exportList,
    callGraph,
    customSections,
    contractName,
  };
}
