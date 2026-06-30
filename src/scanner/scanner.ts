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
        let entries: string[];

        try {
            entries = fs.readdirSync(dir);
        } catch (error) {
            console.error(
                `Unable to read directory '${dir}': ${
                    error instanceof Error ? error.message : "Unknown error"
                }`
            );
            return;
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry);

            try {
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    scan(fullPath);
                } else if (entry.endsWith(".ts")) {
                    filesScanned++;

                    const content = fs.readFileSync(fullPath, "utf-8");

                    const regex = /contract\.call\s*\(\s*["'`](.*?)["'`]/g;

                    let match;

                    while ((match = regex.exec(content)) !== null) {
                        if (match[1]) {
                            contractCalls.push(match[1]);
                        }
                    }
                }
            } catch (error) {
                console.error(
                    `Skipping '${fullPath}': ${
                        error instanceof Error ? error.message : "Unknown error"
                    }`
                );
            }
        }
    }

    scan(directory);

    return {
        contractCalls,
        filesScanned
    };
}