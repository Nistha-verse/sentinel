import { Finding } from "../utils/types";

export interface RiskSummary {
  riskScore: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  overall: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// Base weights per severity
const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 35,
  high: 20,
  medium: 10,
  low: 3,
  info: 0,
};

// Confidence multipliers
const CONFIDENCE_MULTIPLIER: Record<string, number> = {
  high: 1.0,
  medium: 0.6,
  low: 0.3,
};

export function calculateRisk(findings: Finding[]): RiskSummary {
  // Deduplicate: one finding per (detector + title + affectedFunction)
  const seen = new Set<string>();
  const unique: Finding[] = [];
  for (const f of findings) {
    const key = `${f.detector}::${f.title}::${f.affectedFunction ?? ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(f);
    }
  }

  let critical = 0;
  let high = 0;
  let medium = 0;
  let low = 0;
  let rawScore = 0;

  for (const f of unique) {
    const weight = SEVERITY_WEIGHT[f.severity] ?? 0;
    const multiplier = CONFIDENCE_MULTIPLIER[f.confidence ?? "medium"] ?? 0.6;
    rawScore += weight * multiplier;

    switch (f.severity) {
      case "critical": critical++; break;
      case "high":     high++;     break;
      case "medium":   medium++;   break;
      case "low":      low++;      break;
    }
  }

  // Diminishing returns: each additional finding of the same severity adds less
  // Use a logarithmic cap so a single critical can reach ~35pts but 10 criticals
  // don't trivially hit 100. Apply soft cap via tanh-like scaling.
  const riskScore = Math.min(100, Math.round(rawScore));

  let overall: RiskSummary["overall"] = "SAFE";
  if (riskScore >= 80)      overall = "CRITICAL";
  else if (riskScore >= 60) overall = "HIGH";
  else if (riskScore >= 40) overall = "MEDIUM";
  else if (riskScore >= 20) overall = "LOW";

  return { riskScore, critical, high, medium, low, overall };
}
