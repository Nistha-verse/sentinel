export type ValidationStatus = "success" | "error" | "warning" | "info" | "pending";

export interface ValidationItem {
  title: string;
  status: ValidationStatus;
  message: string;
}

export interface ValidationSection {
  name: string;
  items: ValidationItem[];
}

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface Finding {
  detector: string;
  title: string;
  severity: Severity;
  description: string;
  recommendation: string;
  evidence?: string;
  affectedFunction?: string;
}
