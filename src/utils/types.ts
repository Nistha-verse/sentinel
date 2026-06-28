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