declare module "@webassemblyjs/wasm-parser" {
  import { Program } from "@webassemblyjs/ast";
  interface DecodeOptions {
    ignoreCodeSection?: boolean;
    ignoreDataSection?: boolean;
    ignoreCustomNameSection?: boolean;
  }
  export function decode(buf: Buffer | Uint8Array, opts?: DecodeOptions): Program;
}

declare module "@webassemblyjs/ast" {
  export interface Position {
    line: number;
    column: number;
  }

  export interface SourceLocation {
    start: Position;
    end: Position;
  }

  export interface BaseNode {
    type: string;
    loc?: SourceLocation;
  }

  export interface Identifier extends BaseNode {
    type: "Identifier";
    value: string;
    raw?: string;
  }

  export interface NumberLiteral extends BaseNode {
    type: "NumberLiteral";
    value: number;
    raw: string;
  }

  export interface LongNumberLiteral extends BaseNode {
    type: "LongNumberLiteral";
    value: { low: number; high: number };
    raw: string;
  }

  export interface FloatLiteral extends BaseNode {
    type: "FloatLiteral";
    value: number;
    raw: string;
  }

  export interface StringLiteral extends BaseNode {
    type: "StringLiteral";
    value: string;
  }

  export type ValType = "i32" | "i64" | "f32" | "f64" | "v128" | "funcref" | "externref";

  export interface FuncParam {
    id?: Identifier;
    valtype: ValType;
  }

  export interface FuncResult {
    valtype: ValType;
  }

  export interface Signature {
    type: "Signature";
    params: FuncParam[];
    results: FuncResult[];
  }

  export interface FuncImportDescr extends BaseNode {
    type: "FuncImportDescr";
    id: Identifier;
    signature: Signature;
  }

  export interface GlobalType extends BaseNode {
    type: "GlobalType";
    valtype: ValType;
    mutability: "const" | "var";
  }

  export interface Memory extends BaseNode {
    type: "Memory";
    id?: Identifier | NumberLiteral;
    limits: Limit;
  }

  export interface Limit {
    type: "Limit";
    min: number;
    max?: number;
  }

  export interface Table extends BaseNode {
    type: "Table";
    elementType: string;
    limits: Limit;
  }

  export type ImportDescr = FuncImportDescr | GlobalType | Memory | Table;

  export interface ModuleImport extends BaseNode {
    type: "ModuleImport";
    module: string;
    name: string;
    descr: ImportDescr;
  }

  export interface ModuleExportDescr extends BaseNode {
    type: "ModuleExportDescr";
    id: Identifier | NumberLiteral;
    exportType: "Func" | "Table" | "Mem" | "Global";
  }

  export interface ModuleExport extends BaseNode {
    type: "ModuleExport";
    name: string;
    descr: ModuleExportDescr;
  }

  // Instructions
  export interface Instr extends BaseNode {
    id: string;
    args?: InstrArg[];
    namedArgs?: Record<string, InstrArg>;
  }

  export type InstrArg =
    | NumberLiteral
    | LongNumberLiteral
    | FloatLiteral
    | Identifier
    | Instr;

  export interface CallInstruction extends Instr {
    id: "call";
    index: NumberLiteral | Identifier;
  }

  export interface CallIndirectInstruction extends Instr {
    id: "call_indirect";
  }

  export interface BlockInstruction extends Instr {
    id: "block";
    label?: Identifier;
    blocktype?: string;
    instr: Instr[];
  }

  export interface LoopInstruction extends Instr {
    id: "loop";
    label?: Identifier;
    blocktype?: string;
    instr: Instr[];
  }

  export interface IfInstruction extends Instr {
    id: "if";
    testLabel?: Identifier;
    blocktype?: string;
    consequent: Instr[];
    alternate?: Instr[];
  }

  export interface FuncBody extends BaseNode {
    type: "FuncBody";
    locals: Local[];
    instrs: Instr[];
  }

  export interface Local {
    type: "Local";
    id?: Identifier;
    valtype: ValType;
  }

  export interface Func extends BaseNode {
    type: "Func";
    name?: Identifier;
    signature: Signature;
    body?: FuncBody;
    isExternal?: boolean;
  }

  export interface Global extends BaseNode {
    type: "Global";
    name?: Identifier;
    globalType: GlobalType;
    init: Instr[];
  }

  export interface Data extends BaseNode {
    type: "Data";
    memoryIndex: NumberLiteral;
    offset: Instr[];
    init: { values: number[] };
  }

  export interface Elem extends BaseNode {
    type: "Elem";
    table: NumberLiteral;
    offset: Instr[];
    funcs: Identifier[];
  }

  export interface SectionMetadata extends BaseNode {
    type: "SectionMetadata";
    section: string;
    startOffset: number;
    size: NumberLiteral;
    vectorOfSize: NumberLiteral;
  }

  export interface CustomSection extends BaseNode {
    type: "CustomSection";
    name: string;
    sectionMetadata: SectionMetadata;
    data: number[];
  }

  export type ModuleField =
    | ModuleImport
    | ModuleExport
    | Func
    | Global
    | Memory
    | Table
    | Data
    | Elem
    | CustomSection
    | SectionMetadata;

  export interface Module extends BaseNode {
    type: "Module";
    id?: string;
    fields: ModuleField[];
    metadata?: { sections: SectionMetadata[] };
  }

  export interface Program extends BaseNode {
    type: "Program";
    body: Module[];
  }

  export type Node =
    | Program
    | Module
    | ModuleField
    | Func
    | FuncBody
    | Instr
    | Identifier
    | NumberLiteral
    | Signature;

  export type TraversalHandler<T extends Node = Node> = (path: {
    node: T;
    parent?: Node;
  }) => void;

  export interface TraversalHandlers {
    ModuleImport?: (path: { node: ModuleImport; parent?: Node }) => void;
    ModuleExport?: (path: { node: ModuleExport; parent?: Node }) => void;
    Func?: (path: { node: Func; parent?: Node }) => void;
    Global?: (path: { node: Global; parent?: Node }) => void;
    Memory?: (path: { node: Memory; parent?: Node }) => void;
    CustomSection?: (path: { node: CustomSection; parent?: Node }) => void;
  }

  export function traverse(ast: Node, handlers: TraversalHandlers): void;
}
