/**
 * Server-side bridge to the Sentinel scanner library.
 *
 * Imports TypeScript sources from the repo-root `src/` tree via the
 * `@sentinel/*` path alias (see tsconfig.json + next.config.ts).
 * No dependency on compiled `dist/` output — works on Vercel without a
 * pre-build of the CLI package.
 *
 * ONLY import this file from Route Handlers (server-side code).
 * Never import it from client components.
 */

export type { Severity, Confidence, Finding } from "@sentinel/utils/types";
export type { SavedReport } from "@sentinel/storage/reportStore";
export type { ScanResult, ScanOptions } from "@sentinel/engine/scanEngine";
export type { StellarNetwork } from "@sentinel/rpc/stellar";

export { scanContract } from "@sentinel/engine/scanEngine";
export { listReports, loadReport } from "@sentinel/storage/reportStore";
export { generateHtmlReport } from "@sentinel/report/htmlReport";
export { generateDashboardReport } from "@sentinel/report/jsonReport";
