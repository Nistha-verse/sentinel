# Sentinel — Production-Quality Soroban Security Scanner

## Executive Summary

After a complete audit of the repository, here is the current state and the full transformation plan.

---

## Current State Analysis

### What Currently Works (PRESERVED)
- ✅ CLI entry point (`src/main.ts`) — basic command dispatch
- ✅ WASM downloader (`src/rpc/wasm.ts`) — uses `@stellar/stellar-sdk` RPC
- ✅ WASM parser (`src/parser/wasmParser.ts`) — uses `@webassemblyjs` to extract functions/imports/exports
- ✅ Report storage (`src/storage/reportStore.ts`) — JSON file save/load/list
- ✅ Risk engine (`src/analysis/riskEngine.ts`) — severity → score calculation
- ✅ Frontend dashboard (`sentinel-dashboard/`) — Next.js with Freighter wallet integration (DO NOT TOUCH)

### What Is Critically Broken / Missing
| Issue | Impact |
|-------|--------|
| `StellarRpcService.getContractSummary()` returns hardcoded TODO stub — never fetches real metadata | **Critical** |
| All detectors are **metadata-only** — no instruction-level analysis | **Critical** |
| `loopDetector`, `panicDetector`, `reentrancyDetector` return empty arrays | **Critical** |
| `authDetector` flags functions by name regex only — no actual opcode analysis | **High** |
| `wasmParser` uses `any` types throughout — no TypeScript strictness | **High** |
| `detectorRunner` uses `any[]` for findings — no type contract | **High** |
| `Finding` type in `utils/types.ts` does not match `ReportFinding` in `storage/reportStore.ts` (mismatched fields) | **High** |
| No HTML report generation | **High** |
| No dashboard backend API server — dashboard currently imports CLI JSON files manually | **High** |
| `report.ts` command has a literal bug: template string uses single quotes (`' No report found...'`) | **Medium** |
| `jsonReport.ts` generates reports inside a loop per section — wrong architecture | **Medium** |
| No `version` command (only `--version` works) — `sentinel version` fails | **Medium** |
| No exit code on success/failure from detectors | **Low** |
| TypeScript strict mode is on but `any` is used in parser and detector runner | **Low** |

---

## User Review Required

> [!IMPORTANT]
> The dashboard currently works by **manually importing** a CLI-generated `report.json` file through the browser. The architecture you requested adds a **backend API server** that the dashboard would call. This is a significant architectural change. My plan adds the API server as a **separate Express server** alongside the Next.js frontend — the dashboard itself is NOT modified. The frontend will continue to work with imported JSON files AND will also be able to call the new API for live scans.

> [!WARNING]
> The `StellarRpcService` in `src/rpc/stellar.ts` currently returns a hardcoded stub. To get real contract metadata (name, WASM hash), I will integrate the Stellar RPC SDK's `getLedgerEntries` and `getContractData` calls. This requires a real RPC URL in the environment. The WASM download already works correctly via `server.getContractWasmByContractId`.

> [!CAUTION]
> Soroban/WASM has fundamental limitations on what can be analyzed statically. I will implement **real instruction-stream analysis** using the `@webassemblyjs` AST where technically feasible, and document clearly where limitations apply (e.g., Soroban traps vs traditional reentrancy). No fake vulnerabilities will be injected.

---

## Open Questions

> [!IMPORTANT]
> **Dashboard API Integration**: The existing dashboard imports JSON files manually. Should I also add a "Scan" tab to the dashboard that calls the new backend API? Or should the dashboard remain file-import-only? (My plan keeps the dashboard unchanged — the API is purely additive for CLI and future use.)

> [!IMPORTANT]
> **Network default**: The WASM downloader defaults to `soroban-testnet.stellar.org`. Should the CLI also support `--network mainnet` as a flag? (My plan adds `--network` support to the scan command.)

---

## Proposed Changes

---

### Layer 1: Type System Foundation

#### [MODIFY] [types.ts](file:///c:/Users/HP/sentinel/src/utils/types.ts)
- Add comprehensive `Finding` interface with all required fields: `detector`, `title`, `severity`, `description`, `recommendation`, `evidence`, `affectedFunction`
- Add `Severity` type union
- Remove duplicate type definitions across files
- This becomes the single source of truth for all finding types

#### [NEW] `src/core/types.ts`
- Central module re-exporting all domain types
- `ScanOptions`, `ScanResult`, `ContractMetadata`, `WasmAnalysis`, `InstructionContext`

---

### Layer 2: Enhanced WASM Parser (Instruction-Aware)

#### [MODIFY] [wasmParser.ts](file:///c:/Users/HP/sentinel/src/parser/wasmParser.ts)
- Eliminate all `any` types — replace with proper `@webassemblyjs/ast` node types
- Extract full instruction stream per function (opcodes, operands)
- Extract function bodies with instruction sequences
- Build basic **Control Flow Graph** (CFG) data per function: block/loop/if/else/end nodes
- Build **Call Graph**: which function calls which (direct calls via `call` opcode)
- Extract **memory operations**: `i32.load`, `i32.store`, `i32.load8_s`, etc.
- Extract **global access**: `global.get`, `global.set`
- Extract **table calls**: `call_indirect` (cross-contract pattern in Soroban)
- Classify Soroban host function imports by category:
  - `l` namespace = ledger (storage read/write)
  - `a` namespace = auth (`require_auth`, `require_auth_for_args`)
  - `x` namespace = cross-contract calls
  - `d` namespace = contract data
  - `e` namespace = events

**Resulting `ParsedContract` interface:**
```ts
interface ParsedContract {
  raw: Buffer;
  ast: WasmModule;
  functions: FunctionInfo[];    // name, index, params, results, body
  imports: ImportInfo[];        // module, name, kind, namespace category
  exports: ExportInfo[];        // name, kind, functionIndex
  callGraph: CallGraph;         // Map<funcIndex, Set<calledFuncIndex>>
  cfg: Map<number, CFGNode[]>;  // per function
  memories: MemoryInfo[];
  globals: GlobalInfo[];
  customSections: CustomSection[];
  sorobanMeta: SorobanMetadata; // parsed from custom sections if present
}
```

**Technical Note on Soroban Custom Sections**: Soroban contracts compiled with `soroban-sdk` embed a `contractspecv0` and `contractmetav0` XDR-encoded custom section. I will parse these to extract function signatures and contract metadata (name, version, author). This is **real metadata extraction**, not guessing.

---

### Layer 3: Real Security Detectors

All detectors will receive the full `ParsedContract` with instruction context.

#### [MODIFY] [authDetector.ts](file:///c:/Users/HP/sentinel/src/detectors/authDetector.ts)
**Real analysis:**
- Scan call graph: identify exported functions that do NOT call `a.require_auth` or `a.require_auth_for_args`
- Identify functions that call storage-write imports (`l.put`, `l.set`) without a prior auth call in the same function or its callers
- Severity: `critical` if an exported entrypoint mutates storage without any auth call in its call chain

#### [MODIFY] [loopDetector.ts](file:///c:/Users/HP/sentinel/src/detectors/loopDetector.ts)
**Real analysis:**
- Traverse CFG per function — count `loop` opcode blocks
- Identify unbounded loops (loops without deterministic termination via `br_if` targeting exit)
- Flag: functions with deeply nested loops (depth > 2) as potential DoS via instruction budget exhaustion

#### [MODIFY] [panicDetector.ts](file:///c:/Users/HP/sentinel/src/detectors/panicDetector.ts)
**Real analysis:**
- Detect `unreachable` opcodes in the instruction stream
- In Soroban/WASM, `unreachable` = contract panic/trap
- Flag: unreachable in non-test paths, especially after arithmetic operations (potential panic on overflow)
- Soroban context: Rust `unwrap()`, `expect()`, `panic!()` all compile to `unreachable`

#### [MODIFY] [reentrancyDetector.ts](file:///c:/Users/HP/sentinel/src/detectors/reentrancyDetector.ts)
**Real analysis with Soroban context:**
- Soroban does NOT support true reentrancy (each cross-contract call is a synchronous trap-safe call)
- However: detect patterns where storage is written, then a cross-contract call is made (`x.call` import), then storage is written again — **state inconsistency pattern**
- This is the Soroban-equivalent of reentrancy risk

#### [NEW] `src/detectors/storageDetector.ts`
- Detect functions that perform storage writes (`l.put`) without ownership validation
- Detect functions that perform storage reads of sensitive keys
- Detect **reinitialization**: storage write to a key that could already exist (missing existence check before `put`)
- Detect excessive storage operations (>10 storage ops per function = resource concern)

#### [NEW] `src/detectors/upgradeDetector.ts`
- Detect `e.update_current_contract_wasm` host function calls
- Flag: upgrade functions without `require_auth` in call chain
- Flag: upgrade functions callable by anyone (no admin check)
- Detect `e.set_contract_data` with `Persistent` storage type (can set contract WASM hash)

#### [NEW] `src/detectors/crossContractDetector.ts`
- Detect `call` to functions that import `x.call` (cross-contract invocations)
- Flag: cross-contract calls where the callee address comes from storage (not hardcoded) = potential dynamic address injection
- Build cross-contract call graph

#### [NEW] `src/detectors/privilegeDetector.ts`
- Detect admin/owner patterns: functions that check a stored admin address
- Flag: admin functions that can be called during initialization before admin is set
- Detect privilege escalation: functions that modify the stored admin without requiring the current admin

#### [NEW] `src/detectors/initializationDetector.ts`
- Detect `initialize`/`init` functions
- Check: does the init function check for existing initialization state? (re-init protection)
- Flag: missing re-initialization guard (any user can reinitialize the contract)

#### [MODIFY] [memoryDetector.ts](file:///c:/Users/HP/sentinel/src/detectors/memoryDetector.ts)
- Detect exported `memory` section (already exists, keep)
- Add: detect unusual memory grow operations (`memory.grow`)
- Add: detect functions with very large stack frame requirements

#### [MODIFY] [callDetector.ts](file:///c:/Users/HP/sentinel/src/detectors/callDetector.ts)
- Replace trivial "list all functions" with: detect `call_indirect` (dynamic dispatch) which can be exploited if table is manipulated
- Detect recursive call patterns via call graph cycle detection

#### [NEW] `src/detectors/hostFunctionDetector.ts`
- Enumerate all Soroban host function imports
- Flag: deprecated or dangerous host functions
- Flag: event emission without auth (silent operations)
- Flag: crypto host function misuse patterns

#### [MODIFY] [detectorRunner.ts](file:///c:/Users/HP/sentinel/src/detectors/detectorRunner.ts)
- Replace `any[]` with typed `Finding[]`
- Each detector becomes a class implementing `IDetector` interface
- Add detector metadata: `id`, `name`, `description`, `category`
- Results include: detector ID, timing, finding count

---

### Layer 4: Real Stellar RPC Integration

#### [MODIFY] [stellar.ts](file:///c:/Users/HP/sentinel/src/rpc/stellar.ts)
- Replace the hardcoded stub with real Stellar RPC calls:
  - Use `server.getLedgerEntries()` with a `ContractCode` key to get WASM hash
  - Use Soroban contract metadata XDR to extract contract name if available
  - Fallback gracefully if metadata not available
  - Support configurable network (testnet/mainnet)

---

### Layer 5: Report Generation (JSON + HTML)

#### [MODIFY] [jsonReport.ts](file:///c:/Users/HP/sentinel/src/report/jsonReport.ts)
- Fix the broken loop-per-section architecture
- Generate a proper structured JSON report matching the dashboard's expected `SentinelReport` format
- Include: contractId, contractName, network, timestamp, riskScore, findings[], sections[]
- Findings include: detector, severity, title, description, recommendation, evidence, affectedFunction

#### [NEW] `src/report/htmlReport.ts`
- Generate a professional, self-contained HTML report
- Include: risk score gauge, findings table with severity badges, call graph summary
- Supports embedded CSS (no external dependencies)
- Dark mode support

#### [MODIFY] [index.ts](file:///c:/Users/HP/sentinel/src/report/index.ts)
- Replace plain console.log with **chalk-colored output**
- Add progress spinner using a simple spinner utility
- Color-code by severity: critical=red, high=orange, medium=yellow, low=blue, info=gray
- Professional banner with Sentinel logo (ASCII art)

---

### Layer 6: Professional CLI

#### [MODIFY] [main.ts](file:///c:/Users/HP/sentinel/src/main.ts)
- Replace manual argv parsing with `commander`
- Add proper `sentinel version` (not just `--version`)
- Add `sentinel scan --network testnet|mainnet`
- Add `sentinel report <id>` — display colored report
- Add `sentinel history` — tabular display with colors
- Add `sentinel report <id> --format html` — download HTML report
- Add proper exit codes: 0=clean, 1=findings, 2=critical findings, 3=error

#### [MODIFY] [scan.ts](file:///c:/Users/HP/sentinel/src/commands/scan.ts)
- Add progress indicators at each stage
- Add `--network` flag
- Add `--output <path>` flag for custom report path
- Add `--format json|html|both` flag

#### [MODIFY] [report.ts](file:///c:/Users/HP/sentinel/src/commands/report.ts)
- Fix the single-quote bug in template string
- Add colored output matching severity
- Add `--format html` support

#### [MODIFY] [help.ts](file:///c:/Users/HP/sentinel/src/commands/help.ts)
- Professional help with colors and aligned columns

#### [MODIFY] [version.ts](file:///c:/Users/HP/sentinel/src/commands/version.ts)
- Show version + build date + node version

---

### Layer 7: Dashboard Backend API Server

#### [NEW] `src/server/index.ts`
Express server entry point. Runs separately from Next.js on port `3001`.

#### [NEW] `src/server/routes/scan.ts`
```
POST /api/scan
  Body: { contractId: string, network: "testnet"|"mainnet" }
  Returns: { scanId: string }  (async — scan starts in background)

GET /api/scan/:id
  Returns: { status: "pending"|"running"|"complete"|"error", progress: number, result?: ScanResult }
```

#### [NEW] `src/server/routes/report.ts`
```
GET /api/report/:id/json   → Returns JSON report
GET /api/report/:id/html   → Returns HTML report
GET /api/history            → Returns list of all scans
```

#### [NEW] `src/server/scanManager.ts`
- In-memory scan job queue (Map<scanId, ScanJob>)
- Each job tracks: status, progress %, startTime, result, error
- Uses the same `scanner engine` as CLI (no code duplication)

#### [NEW] `src/server/middleware/cors.ts`
- CORS middleware allowing Next.js origin (`localhost:3000`)

---

### Layer 8: Scanner Engine (Shared Core)

#### [NEW] `src/engine/scanEngine.ts`
The **single scanner engine** used by both CLI and API server.

```ts
interface ScanEngine {
  scan(contractId: string, options: ScanOptions): Promise<ScanResult>;
  scanLocal(filePath: string, options: ScanOptions): Promise<ScanResult>;
}
```

This replaces the scan logic currently embedded in `commands/scan.ts`.

---

### Layer 9: Package Quality

#### [MODIFY] [package.json](file:///c:/Users/HP/sentinel/package.json)
- Add `express` and `@types/express` dependencies
- Add `cors` dependency
- Add `ora` for progress spinners
- Add `cli-table3` for tabular output
- Add proper `files` array for npm publish
- Add `engines` field (Node >= 18)
- Add `keywords` for npm discoverability
- Add `repository`, `bugs`, `homepage` fields
- Update `scripts`: `dev`, `build`, `start`, `serve` (API server), `test`

#### [MODIFY] [tsconfig.json](file:///c:/Users/HP/sentinel/tsconfig.json)
- Enable `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`
- Remove `jsx: react-jsx` (not needed for CLI/server code)
- Add `resolveJsonModule: true`

#### [NEW] `README.md`
- Full professional README with installation, usage, architecture diagram
- Both CLI and dashboard documentation

#### [NEW] `CHANGELOG.md`
- Semantic versioning changelog

#### [NEW] `.env.example`
- Template for required environment variables

---

## Files That Will NOT Be Modified
- `sentinel-dashboard/` — entire Next.js frontend (untouched)
- `demo-contracts/` — Rust contract examples (untouched)
- `src/rpc/wasm.ts` — WASM downloader (already works correctly)
- `src/storage/reportStore.ts` — Report storage (already works, minor extension only)
- `src/analysis/riskEngine.ts` — Risk scoring (already correct)

---

## Verification Plan

### Automated Build Check
```bash
npm run build   # TypeScript compilation — must succeed with 0 errors
```

### Manual CLI Verification
```bash
# Version
sentinel version

# Help
sentinel help

# Scan a testnet contract
sentinel scan CBOT2ZNHCXFZRS5LBUUBQ7V3RH63WSNPF3GQ2HVDYDLR6GVJXRWG24X

# View report
sentinel report CBOT2ZNHCXFZRS5LBUUBQ7V3RH63WSNPF3GQ2HVDYDLR6GVJXRWG24X

# View history
sentinel history
```

### API Server Verification
```bash
npm run serve   # Start API server on port 3001

# POST scan request
curl -X POST http://localhost:3001/api/scan \
  -H "Content-Type: application/json" \
  -d '{"contractId":"CBOT2ZNHCXFZRS5LBUUBQ7V3RH63WSNPF3GQ2HVDYDLR6GVJXRWG24X","network":"testnet"}'

# GET scan status
curl http://localhost:3001/api/scan/<scanId>

# GET history
curl http://localhost:3001/api/history
```

### Type Safety Verification
- Zero `any` types in production code (only in declaration files for `@webassemblyjs`)
- All detector functions return typed `Finding[]`
- All imports/exports use named types

---

## Implementation Order

1. **Type System** — Unified `Finding` type, strict TypeScript
2. **Enhanced WASM Parser** — Instruction extraction, CFG, call graph
3. **Scanner Engine** — Shared core, replaces embedded logic in scan.ts
4. **Detectors** — All 13 detectors, instruction-aware
5. **Real RPC Integration** — Fix `stellar.ts` stub
6. **Report Generation** — JSON + HTML, proper format
7. **CLI Improvements** — Colors, progress, proper commands, exit codes
8. **Dashboard API Server** — Express server, async scan management
9. **Package Quality** — README, CHANGELOG, package.json cleanup

---

## New Directory Structure (After Implementation)

```
sentinel/
├── src/
│   ├── main.ts                    # CLI entry (commander-based)
│   ├── core/
│   │   └── types.ts               # [NEW] Central domain types
│   ├── engine/
│   │   └── scanEngine.ts          # [NEW] Shared scan engine
│   ├── parser/
│   │   └── wasmParser.ts          # [MODIFY] Instruction-aware
│   ├── rpc/
│   │   ├── stellar.ts             # [MODIFY] Real RPC integration
│   │   └── wasm.ts                # [KEEP] Already works
│   ├── detectors/
│   │   ├── IDetector.ts           # [NEW] Detector interface
│   │   ├── detectorRunner.ts      # [MODIFY] Typed, class-based
│   │   ├── authDetector.ts        # [MODIFY] Instruction-aware
│   │   ├── storageDetector.ts     # [NEW]
│   │   ├── upgradeDetector.ts     # [NEW]
│   │   ├── crossContractDetector.ts # [NEW]
│   │   ├── privilegeDetector.ts   # [NEW]
│   │   ├── initializationDetector.ts # [NEW]
│   │   ├── hostFunctionDetector.ts   # [NEW]
│   │   ├── loopDetector.ts        # [MODIFY] CFG-based
│   │   ├── panicDetector.ts       # [MODIFY] Unreachable detection
│   │   ├── reentrancyDetector.ts  # [MODIFY] State-call-state pattern
│   │   ├── memoryDetector.ts      # [MODIFY] Memory grow detection
│   │   ├── callDetector.ts        # [MODIFY] call_indirect detection
│   │   ├── exportDetector.ts      # [MODIFY] Proper export analysis
│   │   ├── importDetector.ts      # [MODIFY] Categorized imports
│   │   ├── metadataDetector.ts    # [MODIFY] Real Soroban metadata
│   │   ├── horizonDetector.ts     # [KEEP] Unchanged
│   │   └── wasmDetector.ts        # [REMOVE/MERGE] Redundant
│   ├── analysis/
│   │   └── riskEngine.ts          # [KEEP] Already works
│   ├── report/
│   │   ├── index.ts               # [MODIFY] Chalk-colored output
│   │   ├── jsonReport.ts          # [MODIFY] Fixed architecture
│   │   └── htmlReport.ts          # [NEW] HTML generation
│   ├── commands/
│   │   ├── scan.ts                # [MODIFY] Commander-based
│   │   ├── report.ts              # [MODIFY] Bug fix + colors
│   │   ├── history.ts             # [MODIFY] Colored table
│   │   ├── help.ts                # [MODIFY] Professional help
│   │   ├── version.ts             # [MODIFY] Extended version info
│   │   └── scanLocal.ts           # [KEEP] Unchanged
│   ├── server/
│   │   ├── index.ts               # [NEW] Express server entry
│   │   ├── scanManager.ts         # [NEW] Async scan job manager
│   │   └── routes/
│   │       ├── scan.ts            # [NEW] POST/GET /api/scan
│   │       └── report.ts          # [NEW] GET /api/report, /api/history
│   ├── storage/
│   │   └── reportStore.ts         # [KEEP] Already works
│   ├── scanner/
│   │   └── scanner.ts             # [KEEP] Local TS scanner
│   ├── validators/
│   │   ├── environmentValidator.ts # [KEEP]
│   │   ├── pipeline.ts             # [KEEP]
│   │   ├── projectValidator.ts     # [KEEP]
│   │   └── usageValidator.ts       # [KEEP]
│   ├── utils/
│   │   └── types.ts               # [MODIFY] Unified Finding type
│   └── types/
│       └── webassemblyjs.d.ts     # [MODIFY] Better type stubs
├── sentinel-dashboard/            # [DO NOT TOUCH]
├── demo-contracts/                # [DO NOT TOUCH]
├── reports/                       # [KEEP] Generated reports
├── tmp/                           # [KEEP] Temp WASM files
├── package.json                   # [MODIFY] Dependencies + scripts
├── tsconfig.json                  # [MODIFY] Stricter settings
├── README.md                      # [NEW/REWRITE]
├── CHANGELOG.md                   # [NEW]
└── .env.example                   # [NEW]
```
