import { Finding } from "../utils/types";

export interface RiskSummary {
    riskScore: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    overall: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export function calculateRisk(findings: Finding[]): RiskSummary {

    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    for (const finding of findings) {

        switch (finding.severity) {

            case "critical":
                critical++;
                break;

            case "high":
                high++;
                break;

            case "medium":
                medium++;
                break;

            case "low":
                low++;
                break;
        }
    }

    let riskScore =
        critical * 40 +
        high * 20 +
        medium * 8 +
        low * 2;

    riskScore = Math.min(riskScore, 100);

    let overall: RiskSummary["overall"] = "SAFE";

    if (critical > 0)
        overall = "CRITICAL";

    else if (high >= 2 || riskScore >= 70)
        overall = "HIGH";

    else if (medium >= 2 || riskScore >= 35)
        overall = "MEDIUM";

    else if (low > 0)
        overall = "LOW";

    return {

        riskScore,

        critical,

        high,

        medium,

        low,

        overall
    };
}