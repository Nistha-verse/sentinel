/** Mirrors Sentinel CLI validation types (src/utils/types.ts) */
export type ValidationStatus =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "pending";

export interface ValidationItem {
  title: string;
  status: ValidationStatus;
  message: string;
}

export interface ValidationSection {
  name: string;
  items: ValidationItem[];
}

export interface SentinelReportSummary {
  errors: number;
  warnings: number;
  info: number;
  pending: number;
  healthScore: number;
}

export interface SentinelReportProject {
  name: string;
  scanDate: string;
  scanTime: string;
  summary: SentinelReportSummary;
  sections: ValidationSection[];
}

export interface SentinelReport {
  project: SentinelReportProject;
}

export type FindingSeverity = "critical" | "warning" | "info";

export interface ReportFinding {
  title: string;
  message: string;
  severity: FindingSeverity;
  section: string;
}

export interface ParsedReport {
  contractId?: string;
  contractName: string;
  scanTimestamp: string;
  coveragePercent: number | null;
  healthScore: number;
  summary: SentinelReportSummary;
  findings: {
    critical: ReportFinding[];
    warning: ReportFinding[];
    info: ReportFinding[];
  };
  sections: ValidationSection[];
}

export type SeverityFilter = "all" | FindingSeverity;
