import pc from "picocolors";
import type { SavedReport } from "../storage/reportStore";
import type { Finding, Severity } from "../utils/types";

export const BANNER = `
${pc.cyan("███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗")}
${pc.cyan("██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║")}
${pc.cyan("███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║")}
${pc.cyan("╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║")}
${pc.cyan("███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗")}
${pc.cyan("╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝")}
${pc.dim("  Soroban Smart Contract Security Scanner")}
`;

export function severityLabel(severity: Severity): string {
  switch (severity) {
    case "critical": return pc.bgRed(pc.white(" CRITICAL "));
    case "high":     return pc.red(" HIGH     ");
    case "medium":   return pc.yellow(" MEDIUM   ");
    case "low":      return pc.blue(" LOW      ");
    case "info":     return pc.dim(" INFO     ");
  }
}

export function riskLabel(score: number, overall: string): string {
  if (score >= 70) return pc.bgRed(pc.white(` ${overall} (${score}/100) `));
  if (score >= 35) return pc.red(` ${overall} (${score}/100)`);
  if (score >= 10) return pc.yellow(` ${overall} (${score}/100)`);
  return pc.green(` ${overall} (${score}/100)`);
}

export function printScanResult(result: {
  report: SavedReport;
  reportPath: string;
  htmlPath: string | undefined;
  durationMs: number;
}): void {
  const { report, reportPath, htmlPath, durationMs } = result;

  console.log();
  console.log(pc.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(pc.bold(pc.cyan("  Sentinel Scan Complete")));
  console.log(pc.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log();
  console.log(`  ${pc.dim("Contract ID  :")} ${report.contractId}`);
  console.log(`  ${pc.dim("Name         :")} ${pc.bold(report.contractName)}`);
  console.log(`  ${pc.dim("Network      :")} ${report.network}`);
  if (report.wasmHash) {
    console.log(`  ${pc.dim("WASM Hash    :")} ${pc.dim(report.wasmHash.slice(0, 16) + "...")}`);
  }
  console.log(`  ${pc.dim("Duration     :")} ${durationMs}ms`);
  console.log();

  // Risk summary
  console.log(pc.bold("  Risk Assessment"));
  console.log(`  ${"─".repeat(50)}`);
  console.log(`  Risk Score   : ${riskLabel(report.riskScore, report.riskScore >= 70 ? "CRITICAL" : report.riskScore >= 35 ? "HIGH" : report.riskScore >= 10 ? "MEDIUM" : "SAFE")}`);
  console.log(`  ${pc.red("Critical")}     : ${report.critical}`);
  console.log(`  ${pc.red("High")}         : ${report.high}`);
  console.log(`  ${pc.yellow("Medium")}       : ${report.medium}`);
  console.log(`  ${pc.blue("Low")}          : ${report.low}`);
  console.log();

  // Findings summary (non-info only)
  const actionable = report.findings.filter((f) => f.severity !== "info");
  if (actionable.length > 0) {
    console.log(pc.bold("  Security Findings"));
    console.log(`  ${"─".repeat(50)}`);
    for (const finding of actionable) {
      console.log(
        `  ${severityLabel(finding.severity)} ${pc.bold(finding.title)}` +
        (finding.affectedFunction ? pc.dim(` [${finding.affectedFunction}]`) : "")
      );
      console.log(`  ${pc.dim("  " + finding.description.slice(0, 100) + (finding.description.length > 100 ? "…" : ""))}`);
      console.log();
    }
  } else {
    console.log(`  ${pc.green("✔")} No actionable security findings detected.`);
    console.log();
  }

  console.log(`  ${pc.dim("JSON Report  :")} ${reportPath}`);
  if (htmlPath) {
    console.log(`  ${pc.dim("HTML Report  :")} ${htmlPath}`);
  }
  console.log();
  console.log(pc.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log();
}

export function printReport(report: SavedReport): void {
  const actionable = report.findings.filter((f) => f.severity !== "info");
  const infoFindings = report.findings.filter((f) => f.severity === "info");

  console.log();
  console.log(pc.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log(pc.bold(pc.cyan("  Sentinel Audit Report")));
  console.log(pc.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log();
  console.log(`  ${pc.dim("Contract ID  :")} ${report.contractId}`);
  console.log(`  ${pc.dim("Name         :")} ${pc.bold(report.contractName)}`);
  console.log(`  ${pc.dim("Network      :")} ${report.network ?? "testnet"}`);
  console.log(`  ${pc.dim("Scanned      :")} ${new Date(report.timestamp).toLocaleString()}`);
  console.log();
  console.log(`  ${pc.dim("Risk Score   :")} ${riskLabel(report.riskScore, report.riskScore >= 70 ? "CRITICAL" : report.riskScore >= 35 ? "HIGH" : report.riskScore >= 10 ? "MEDIUM" : "SAFE")}`);
  console.log(`  ${pc.red("Critical")} ${report.critical}  ${pc.red("High")} ${report.high}  ${pc.yellow("Medium")} ${report.medium}  ${pc.blue("Low")} ${report.low}  ${pc.dim("Info")} ${infoFindings.length}`);
  console.log();

  if (actionable.length === 0) {
    console.log(`  ${pc.green("✔")} No actionable security findings.`);
  } else {
    console.log(pc.bold(`  Findings (${actionable.length} actionable)`));
    console.log(`  ${"─".repeat(50)}`);
    actionable.forEach((finding, i) => {
      console.log(
        `\n  ${pc.bold(`${i + 1}.`)} ${severityLabel(finding.severity)} ${pc.bold(finding.title)}` +
        (finding.affectedFunction ? pc.dim(` — ${finding.affectedFunction}`) : "")
      );
      console.log(`     ${pc.dim("Description  :")} ${finding.description}`);
      console.log(`     ${pc.dim("Recommend    :")} ${finding.recommendation}`);
      if (finding.evidence) {
        console.log(`     ${pc.dim("Evidence     :")} ${pc.dim(finding.evidence)}`);
      }
    });
  }

  console.log();
  console.log(pc.bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  console.log();
}

// Legacy shim — kept so scanLocal.ts still compiles
export { printReport as printValidationReport };
