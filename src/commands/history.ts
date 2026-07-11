import pc from "picocolors";
import { listReports } from "../storage/reportStore";

export async function runHistory(): Promise<void> {
  const reports = listReports();

  if (reports.length === 0) {
    console.log(pc.dim("\n  No reports found. Run: sentinel scan <contract-id>\n"));
    return;
  }

  console.log();
  console.log(
    pc.bold("  " + "CONTRACT ID".padEnd(57)) +
    pc.bold("NETWORK".padEnd(12)) +
    pc.bold("RISK".padEnd(8)) +
    pc.bold("C/H/M/L".padEnd(14)) +
    pc.bold("DATE")
  );
  console.log("  " + "─".repeat(110));

  for (const report of reports) {
    const riskStr = String(report.riskScore).padEnd(8);
    const riskColored =
      report.riskScore >= 70
        ? pc.red(riskStr)
        : report.riskScore >= 35
        ? pc.yellow(riskStr)
        : report.riskScore >= 10
        ? pc.blue(riskStr)
        : pc.green(riskStr);

    const counts =
      `${pc.red(String(report.critical))}/${pc.red(String(report.high))}/${pc.yellow(String(report.medium))}/${pc.blue(String(report.low))}`.padEnd(14);

    const date = new Date(report.timestamp).toLocaleString();

    console.log(
      "  " +
      report.contractId.padEnd(57) +
      (report.network ?? "testnet").padEnd(12) +
      riskColored +
      counts +
      pc.dim(date)
    );
  }

  console.log();
}
