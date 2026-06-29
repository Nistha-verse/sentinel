import * as fs from "fs";
import {ValidationSection} from "../utils/types";
import { report } from "process";
export function generateJsonReport(reportPath: string, sections: ValidationSection[]): void {
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let pendingCount = 0;
    for (const section of sections) {
        for (const item of section.items) {
            if (item.status === "error") {
                errorCount++;
            } else if (item.status === "warning") {
                warningCount++;
            } else if (item.status === "info") {
                infoCount++;
            } else if (item.status === "pending") {
                pendingCount++;
            }
        }
        const report= {
            project: {
                name: "Sentinel Scan",
                scanDate: new Date().toISOString(),
                scanTime: new Date().toLocaleTimeString(),
                summary: {
                    errors: errorCount,
                    warnings: warningCount,
                    info: infoCount,
                    pending: pendingCount,
                    healthScore: Math.max(0, 100 - (errorCount * 5 + warningCount * 2 + infoCount * 1 + pendingCount * 0.5))
                },
                sections: sections
            }
        };
            if (!fs.existsSync(reportPath)) {
                fs.mkdirSync(reportPath, { recursive: true });
            }
            fs.writeFileSync(`${reportPath}/report.json`, JSON.stringify(report, null, 2));
    }
}