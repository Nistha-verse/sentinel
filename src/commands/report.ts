import * as path from "path";
import pc from "picocolors";
import { loadReport } from "../storage/reportStore";
import { printReport } from "../report";
import { writeHtmlReport } from "../report/htmlReport";

export interface ReportCommandOptions {
  html?: boolean;
  outputDir?: string;
}

export async function runReport(
  contractId: string,
  options: ReportCommandOptions = {}
): Promise<void> {
  const report = loadReport(contractId);

  if (!report) {
    console.error(
      pc.red(`\n  ✖ No report found for contract: ${contractId}`)
    );
    console.log(
      pc.dim(`  Run: sentinel scan ${contractId}\n`)
    );
    process.exitCode = 1;
    return;
  }

  printReport(report);

  if (options.html) {
    const outDir =
      options.outputDir ?? path.resolve(process.cwd(), "reports");
    const htmlPath = writeHtmlReport(report, outDir);
    console.log(`  ${pc.green("✔")} HTML report written: ${htmlPath}\n`);
  }
}
