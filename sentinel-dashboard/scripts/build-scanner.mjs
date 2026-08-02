/**
 * Builds the sibling sentinel-soroban CLI (CommonJS) and copies its dist/
 * output into sentinel-dashboard/.sentinel-dist so the Next.js app can load
 * it at runtime via a child-process bridge — without importing CLI TypeScript
 * sources and without committing dist/ to git.
 *
 * Usage:
 *   node scripts/build-scanner.mjs           # always rebuild
 *   node scripts/build-scanner.mjs --if-needed  # skip when already built
 */
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = resolve(__dirname, "..");
const repoRoot = resolve(dashboardRoot, "..");
const distSrc = join(repoRoot, "dist");
const distDest = join(dashboardRoot, ".sentinel-dist");
const ifNeeded = process.argv.includes("--if-needed");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    // Windows needs shell to spawn .cmd shims (npm.cmd); argv is fixed literals.
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.error) {
    console.error("[build-scanner] Failed to spawn", command, result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (ifNeeded && existsSync(join(distDest, ".sentinel-built"))) {
  console.log("[build-scanner] .sentinel-dist already present — skipping.");
  process.exit(0);
}

if (!existsSync(join(repoRoot, "package.json"))) {
  console.error(
    "[build-scanner] Repo root package.json not found at",
    repoRoot
  );
  process.exit(1);
}

console.log("[build-scanner] Installing CLI package dependencies...");
run(npmCmd, ["ci"], repoRoot);

if (!existsSync(distSrc)) {
  console.error("[build-scanner] Expected dist/ at", distSrc);
  process.exit(1);
}

rmSync(distDest, { recursive: true, force: true });
mkdirSync(dirname(distDest), { recursive: true });
cpSync(distSrc, distDest, { recursive: true });

// Marker so runtime can fail fast with a clear message if prebuild was skipped.
writeFileSync(
  join(distDest, ".sentinel-built"),
  new Date().toISOString() + "\n",
  "utf8"
);

console.log("[build-scanner] Copied CLI build →", distDest);
