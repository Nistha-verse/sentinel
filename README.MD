# Sentinel

Production-quality Stellar Soroban Smart Contract Security Scanner.

## Installation

```bash
npm install -g sentinel-soroban
```

Or run without installing:

```bash
npx sentinel-soroban scan <contract-id>
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

## Commands

### `sentinel scan <contract-id>`

Fetches the contract WASM from the Stellar RPC, parses it, runs all 15 security
detectors, calculates a risk score, and saves the report to `reports/`.

```bash
sentinel scan CBOT2ZNHCXFZRS5LBUUBQ7V3RH63WSNPF3GQ2HVDYDLR6GVJXRWG24X
sentinel scan CBOT2Z... --network mainnet
sentinel scan CBOT2Z... --html                   # also write an HTML report
sentinel scan CBOT2Z... --rpc-url https://...    # custom RPC endpoint
```

| Flag | Default | Description |
|------|---------|-------------|
| `--network` | `testnet` | Target network: `testnet` or `mainnet` |
| `--html` | off | Write a self-contained HTML report alongside the JSON |
| `--rpc-url` | — | Override the Stellar RPC endpoint for this scan only |

---

### `sentinel scan-local <path>`

Validates a local Soroban project directory without touching the network.
Checks project structure, environment configuration, and function usage.

```bash
sentinel scan-local ./my-soroban-contract
sentinel scan-local /absolute/path/to/project
```

Output covers three sections: **Project Structure**, **Environment Validation**,
and **Function Usage**. Each item is marked ✔ success, ✖ error, ⚠ warning, or ℹ info.

---

### `sentinel report <contract-id>`

Displays a previously saved scan report in the terminal.

```bash
sentinel report CBOT2Z...
sentinel report CBOT2Z... --html               # also regenerate the HTML file
sentinel report CBOT2Z... --html --output ./out
```

| Flag | Description |
|------|-------------|
| `--html` | Re-export the report as a self-contained HTML file |
| `--output <dir>` | Directory to write the HTML file (default: `reports/`) |

---

### `sentinel history`

Lists every saved scan report sorted newest-first with contract ID, network,
risk score, and critical/high/medium/low finding counts.

```bash
sentinel history
```

---

### `sentinel version`

Prints the Sentinel version, Node.js version, and platform.

```bash
sentinel version
# Sentinel v1.0.0
# Node.js v20.11.0
# Platform linux/x64
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Clean — no actionable findings |
| `1` | High severity findings detected |
| `2` | Critical severity findings detected |
| `3` | Scan error |

## Reports

Every scan writes two files to `reports/` in the current working directory.

### JSON Report

`reports/<contract-id>.json` — machine-readable, suitable for CI integration
and dashboard consumption.

```json
{
  "contractId": "CBOT2Z...",
  "contractName": "My Token",
  "network": "testnet",
  "wasmHash": "abc123...",
  "riskScore": 42,
  "critical": 0,
  "high": 1,
  "medium": 2,
  "low": 3,
  "timestamp": "2026-07-15T12:00:00.000Z",
  "scannedBy": "sentinel",
  "findings": [
    {
      "detector": "auth",
      "title": "Missing require_auth",
      "severity": "high",
      "confidence": "high",
      "description": "...",
      "recommendation": "...",
      "evidence": "func_12",
      "affectedFunction": "transfer"
    }
  ]
}
```

Risk score thresholds:

| Score | Label |
|-------|-------|
| 0–9 | SAFE |
| 10–34 | MEDIUM |
| 35–69 | HIGH |
| 70–100 | CRITICAL |

### HTML Report

`reports/<contract-id>.html` — self-contained, zero-dependency HTML file.
Open in any browser. Contains:

- Contract metadata (ID, name, network, WASM hash, scan time)
- Risk score gauge with colour coding
- Critical / High / Medium / Low / Info finding counts
- Per-finding cards: severity badge, confidence, affected function, description,
  recommendation, and evidence
- Grouped by severity for easy triage

Generate during a scan:

```bash
sentinel scan <contract-id> --html
```

Regenerate from a saved report:

```bash
sentinel report <contract-id> --html
```

## Dashboard API Server

Start the backend API server (port 3001 by default):

```bash
npm run serve
```

The API server exposes the same scan pipeline used by the CLI. Both the CLI and
the dashboard write to the same `reports/` directory, so every CLI scan
automatically appears in the dashboard history and vice versa.

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

### Dashboard Integration

The Next.js dashboard (`sentinel-dashboard/`) connects to the API server and
provides a browser UI for scanning, viewing reports, and browsing history.

```bash
# Terminal 1 — start the API backend
npm run serve

# Terminal 2 — start the dashboard
cd sentinel-dashboard
npm run dev
```

The dashboard also ships its own Next.js Route Handlers under `/api/` so it can
run standalone without the Express server. Set `NEXT_PUBLIC_SENTINEL_API` in
`sentinel-dashboard/.env.local` to point at a remote API server if needed.

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
