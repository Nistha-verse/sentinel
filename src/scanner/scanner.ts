import * as fs from "fs";
import * as path from "path";

export interface ScanResult {
    contractCalls: string[];
    filesScanned: number;
}

export function scanTypeScript(directory: string): ScanResult {
    const contractCalls: string[] = [];
    let filesScanned = 0;

    function scan(dir: string) {
        const entries = fs.readdirSync(dir);

        for (const entry of entries) {
            const fullPath = path.join(dir, entry);

            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                scan(fullPath);
            } else if (entry.endsWith(".ts")) {
                filesScanned++;

                const content = fs.readFileSync(fullPath, "utf-8");

                const regex = /contract\.call\s*\(\s*["'`](.*?)["'`]/g;

                let match;

                while ((match = regex.exec(content)) !== null) {
                    const call = match[1];
                    if (call !== undefined) {
                        contractCalls.push(call);
                    }
                }
            }
        }
    }

    scan(directory);

    return {
        contractCalls,
        filesScanned
    };
}