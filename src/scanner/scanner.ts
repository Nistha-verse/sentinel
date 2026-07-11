import * as fs from "fs";
import * as path from "path";

export interface ScanResult {
    contractCalls: string[];
    filesScanned: number;
    wasmPath?: string;
}

export function scanTypeScript(directory: string): ScanResult {

    const contractCalls: string[] = [];
    let filesScanned = 0;
    let wasmPath: string | undefined;

    const ignoredDirectories = new Set([
        "node_modules",
        ".git",
        "dist",
        "coverage"
    ]);

    function scan(dir: string) {

        let entries: string[];

        try {
            entries = fs.readdirSync(dir);
        } catch {
            return;
        }

        for (const entry of entries) {

            const fullPath = path.join(dir, entry);

            let stat;

            try {
                stat = fs.statSync(fullPath);
            } catch {
                continue;
            }

            if (stat.isDirectory()) {

                if (!ignoredDirectories.has(entry)) {
                    scan(fullPath);
                }

                continue;
            }

            if (entry.endsWith(".wasm") && !wasmPath) {
                wasmPath = fullPath;
            }

            if (!entry.endsWith(".ts")) {
                continue;
            }

            filesScanned++;

            const content = fs.readFileSync(fullPath, "utf8");

            const regex =
                /contract\.call\s*\(\s*["'`](.*?)["'`]/g;

            let match;

            while ((match = regex.exec(content)) !== null) {

                if (match[1]) {
                    contractCalls.push(match[1]);
                }

            }

        }

    }

    scan(directory);

    return {
        contractCalls,
        filesScanned,
        ...wasmPath ? { wasmPath } : {}
    };

}