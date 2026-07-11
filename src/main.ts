#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import pc from "picocolors";

import { runScan } from "./commands/scan";
import { runScanLocal } from "./commands/scanLocal";
import { runReport } from "./commands/report";
import { runHistory } from "./commands/history";
import { runVersion } from "./commands/version";
import { runHelp } from "./commands/help";

const pkgPath = path.resolve(__dirname, "../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as { version?: string };
const VERSION = pkg.version ?? "1.0.0";

const program = new Command();

program
  .name("sentinel")
  .description("Soroban Smart Contract Security Scanner")
  .version(VERSION, "-v, --version", "Print version")
  .helpOption("-h, --help", "Show help")
  .addHelpCommand("help", "Show help");

program
  .command("scan <contract-id>")
  .description("Scan a deployed Soroban contract by contract ID")
  .option("-n, --network <network>", "Target network: testnet or mainnet", "testnet")
  .option("--html", "Also generate an HTML report", false)
  .option("--rpc-url <url>", "Custom Stellar RPC endpoint")
  .action(async (contractId: string, opts: { network: string; html: boolean; rpcUrl?: string }) => {
    try {
      await runScan(contractId, {
        network: opts.network === "mainnet" ? "mainnet" : "testnet",
        html: opts.html,
        ...(opts.rpcUrl !== undefined ? { rpcUrl: opts.rpcUrl } : {}),
      });
    } catch (err) {
      console.error(pc.red("\n  ✖ Scan failed:"), err instanceof Error ? err.message : err);
      process.exitCode = 3;
    }
  });

program
  .command("scan-local <path>")
  .description("Scan a local Soroban project directory")
  .action(async (targetPath: string) => {
    await runScanLocal(targetPath);
  });

program
  .command("report <contract-id>")
  .description("Display a saved scan report")
  .option("--html", "Export report as HTML file", false)
  .option("--output <dir>", "Output directory for HTML report")
  .action(async (contractId: string, opts: { html: boolean; output?: string }) => {
    await runReport(contractId, {
      html: opts.html,
      ...(opts.output !== undefined ? { outputDir: opts.output } : {}),
    });
  });

program
  .command("history")
  .description("List all saved scan reports")
  .action(async () => {
    await runHistory();
  });

program
  .command("version")
  .description("Show Sentinel version information")
  .action(async () => {
    await runVersion();
  });

// Override default help to use our colored help
program.on("--help", () => {
  void runHelp();
});

// Handle bare `sentinel help`
program
  .command("help", { hidden: true })
  .action(async () => {
    await runHelp();
  });

// Parse — if no args, show help
if (process.argv.length <= 2) {
  void runHelp();
} else {
  program.parseAsync(process.argv).catch((err: unknown) => {
    console.error(pc.red("  ✖ Error:"), err instanceof Error ? err.message : err);
    process.exitCode = 3;
  });
}
