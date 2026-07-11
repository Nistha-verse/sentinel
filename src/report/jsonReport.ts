import * as fs from "fs";
import * as path from "path";
import type { SavedReport } from "../storage/reportStore";
import type { Finding, Severity } from "../utils/types";

// Dashboard-compatible SentinelReport format
interface SentinelReportSummary {
  errors: number;
  warnings: number;
  info: number;
  pending: number;
  healthScore: number;
}

interface ValidationItem {
  title: string;
  status: "success" | "error" | "warning" | "info" | "pending";
  message: string;
}

interface ValidationSection {
  name: string;
  items: ValidationItem[];
}

interface SentinelReport {
  project: {
    name: string;
    scanDate: string;
    scanTime: string;
    summary: SentinelReportSummary;
    sections: ValidationSection[];
  };
}

function severityToStatus(
  severity: Severity
): ValidationItem["status"] {
  switch (severity) {
    case "critical":
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "warning";
    case "info":
      return "info";
  }
}

function groupFindingsByDetector(findings: Finding[]): ValidationSection[] {
  const groups = new Map<string, Finding[]>();

  for (const finding of findings) {
    const key = finding.detector;
    const group = groups.get(key) ?? [];
    group.push(finding);
    groups.set(key, group);
  }

  const sections: ValidationSection[] = [];

  for (const [detector, detectorFindings] of groups) {
    sections.push({
      name: detector.charAt(0).toUpperCase() + detector.slice(1) + " Analysis",
      items: detectorFindings.map((f) => ({
        title: f.title,
        status: severityToStatus(f.severity),
        message: f.description,
      })),
    });
  }

  return sections;
}

export function generateDashboardReport(report: SavedReport): SentinelReport {
  const now = new Date(report.timestamp);

  const errorCount = report.findings.filter(
    (f) => f.severity === "critical" || f.severity === "high"
  ).length;
  const warningCount = report.findings.filter(
    (f) => f.severity === "medium" || f.severity === "low"
  ).length;
  const infoCount = report.findings.filter((f) => f.severity === "info").length;

  const healthScore = Math.max(
    0,
    100 - errorCount * 10 - warningCount * 3 - infoCount * 0.5
  );

  const sections = groupFindingsByDetector(report.findings);

  // Add a function usage section so the dashboard can compute coverage
  const exportedFunctions = report.findings
    .filter((f) => f.detector === "export" && f.affectedFunction)
    .map((f) => f.affectedFunction as string);

  if (exportedFunctions.length > 0) {
    sections.push({
      name: "Function Usage",
      items: exportedFunctions.map((name) => ({
        title: name,
        status: "info" as const,
        message: `Exported function '${name}' — review authorization and usage.`,
      })),
    });
  }

  return {
    project: {
      name: report.contractName,
      scanDate: now.toISOString(),
      scanTime: now.toLocaleTimeString(),
      summary: {
        errors: errorCount,
        warnings: warningCount,
        info: infoCount,
        pending: 0,
        healthScore: Math.round(healthScore),
      },
      sections,
    },
  };
}

export function writeDashboardReport(report: SavedReport, outputDir: string): string {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const dashboardReport = generateDashboardReport(report);
  const outPath = path.join(outputDir, `${report.contractId}.dashboard.json`);
  fs.writeFileSync(outPath, JSON.stringify(dashboardReport, null, 2), "utf8");
  return outPath;
}
