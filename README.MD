# Sentinel

Production-quality Stellar Soroban Smart Contract Security Scanner.

## Installation

```bash
npm install -g sentinel-soroban
```

## CLI Usage

```bash
# Scan a deployed contract
sentinel scan <contract-id>

# Scan on mainnet and generate HTML report
sentinel scan <contract-id> --network mainnet --html

# View a saved report
sentinel report <contract-id>

# Export report as HTML
sentinel report <contract-id> --html

# List all saved reports
sentinel history

# Scan a local project directory
sentinel scan-local ./my-contract

# Version info
sentinel version
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Clean — no actionable findings |
| `1` | High severity findings detected |
| `2` | Critical severity findings detected |
| `3` | Scan error |

## Dashboard API Server

Start the backend API server (port 3001 by default):

```bash
npm run serve
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/scan` | Start an async scan |
| `GET` | `/api/scan/:id` | Poll scan status |
| `GET` | `/api/report/:id/json` | Dashboard-compatible JSON report |
| `GET` | `/api/report/:id/html` | Self-contained HTML report |
| `GET` | `/api/report/:id/raw` | Raw scan report JSON |
| `GET` | `/api/history` | List all saved reports |
| `GET` | `/api/health` | Health check |

### Scan a contract via API

```bash
# Start scan
curl -X POST http://localhost:3001/api/scan \
  -H "Content-Type: application/json" \
  -d '{"contractId":"CBOT2Z...","network":"testnet"}'

# Poll status
curl http://localhost:3001/api/scan/<scanId>

# Get HTML report
curl http://localhost:3001/api/report/<contractId>/html > report.html
```

## Architecture

```
CLI / API Server
      ↓
  Scan Engine (src/engine/scanEngine.ts)
      ↓
  RPC Layer          WASM Downloader
  (stellar.ts)       (wasm.ts)
      ↓                   ↓
              WASM Parser
         (parser/wasmParser.ts)
         - Instruction extraction
         - Call graph
         - CFG / loop depth
         - Soroban namespace classification
              ↓
         Detector Engine (15 detectors)
         - Authorization
         - Initialization
         - Storage
         - Upgrade
         - Privilege
         - Reentrancy
         - Cross-Contract
         - Loop
         - Panic
         - Memory
         - Call Graph
         - Host Function
         - Export / Import / Metadata
              ↓
         Risk Engine
              ↓
    JSON Report + HTML Report
              ↓
           Storage
```

## Detectors

| Detector | Category | Description |
|----------|----------|-------------|
| `auth` | Access Control | Missing `require_auth` on state-mutating exports |
| `initialization` | State Management | Re-initialization vulnerability |
| `storage` | State Management | Excessive ops, missing existence checks |
| `upgrade` | Access Control | Contract upgrade without authorization |
| `privilege` | Access Control | Admin transfer without auth |
| `reentrancy` | State Management | State-call-state pattern |
| `cross-contract` | External Interaction | Dynamic address injection |
| `loop` | Resource | Unbounded loops, deep nesting |
| `panic` | Reliability | `unreachable` opcodes (Rust panics) |
| `memory` | Memory | Exported memory, `memory.grow` |
| `call` | Control Flow | `call_indirect`, recursion |
| `host-function` | Host Interface | Soroban host function analysis |
| `export` | Surface Area | Suspicious exports, large attack surface |
| `import` | Host Interface | Non-Soroban imports |
| `metadata` | Metadata | Contract overview and custom sections |

## Environment

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `STELLAR_RPC_URL` | testnet RPC | Override RPC endpoint |
| `SENTINEL_DEBUG` | `0` | Enable verbose detector output |
| `SENTINEL_PORT` | `3001` | API server port |
| `DASHBOARD_ORIGIN` | `http://localhost:3000` | CORS origin for dashboard |

## Development

```bash
# Build
npm run build

# Run CLI without building
npm run dev -- scan <contract-id>

# Start API server (requires build first)
npm run serve

# Start API server in dev mode
npm run dev:serve
```

## License

MIT
