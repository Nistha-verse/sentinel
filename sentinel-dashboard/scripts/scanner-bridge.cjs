/**
 * Child-process bridge to the prebuilt Sentinel CLI (CommonJS).
 *
 * Runs outside Next.js / Turbopack. Loads modules from
 * sentinel-dashboard/.sentinel-dist (produced by scripts/build-scanner.mjs).
 *
 * Protocol:
 *   argv[2]  = command name
 *   stdin    = optional JSON payload
 *   stdout   = JSON { ok: true, result } | { ok: false, error }
 */
"use strict";

const fs = require("fs");
const path = require("path");

const distRoot = path.join(__dirname, "..", ".sentinel-dist");

function assertBuilt() {
  if (!fs.existsSync(path.join(distRoot, ".sentinel-built"))) {
    throw new Error(
      "Sentinel scanner build not found (.sentinel-dist). " +
        "Run `npm run build:scanner` from sentinel-dashboard/ first."
    );
  }
}

function load(relPath) {
  assertBuilt();
  return require(path.join(distRoot, relPath));
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    process.stdin.on("error", reject);
  });
}

async function run(command, input) {
  switch (command) {
    case "scan": {
      const { scanContract } = load(path.join("engine", "scanEngine.js"));
      return scanContract(input.contractId, input.options ?? {});
    }
    case "listReports": {
      const { listReports } = load(path.join("storage", "reportStore.js"));
      return listReports();
    }
    case "loadReport": {
      const { loadReport } = load(path.join("storage", "reportStore.js"));
      return loadReport(input.contractId);
    }
    case "generateHtmlReport": {
      const { generateHtmlReport } = load(path.join("report", "htmlReport.js"));
      return generateHtmlReport(input.report);
    }
    case "generateDashboardReport": {
      const { generateDashboardReport } = load(
        path.join("report", "jsonReport.js")
      );
      return generateDashboardReport(input.report);
    }
    default:
      throw new Error(`Unknown bridge command: ${command}`);
  }
}

async function main() {
  const command = process.argv[2];
  if (!command) {
    throw new Error("Usage: node scanner-bridge.cjs <command>");
  }

  const input = await readStdin();
  const result = await run(command, input);
  process.stdout.write(JSON.stringify({ ok: true, result }));
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stdout.write(JSON.stringify({ ok: false, error: message }));
  process.exitCode = 1;
});
