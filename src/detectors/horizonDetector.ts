import * as fs from "fs";
import * as path from "path";
import { ValidationSection, ValidationItem } from "../utils/types";

export function detectHorizon(scanPath: string): ValidationSection {
    const items: ValidationItem[] = [];

    let stellarSdkDetected = false;
    let horizonDetected = false;
    let rpcDetected = false;
    let submitDetected = false;
    let simulateDetected = false;

    function scanDirectory(dir: string) {
        const entries = fs.readdirSync(dir);

        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else if (entry.endsWith(".ts")) {
                const content = fs.readFileSync(fullPath, "utf-8");

                // Detect Stellar SDK
                if (
                    content.includes("@stellar/stellar-sdk") ||
                    content.includes("stellar-sdk")
                ) {
                    stellarSdkDetected = true;
                }

                // Detect Horizon client
                if (
                    content.includes("Horizon.Server") ||
                    content.includes("new Horizon.Server")
                ) {
                    horizonDetected = true;
                }

                // Detect Soroban RPC client
                if (
                    content.includes("SorobanRpc.Server") ||
                    content.includes("new SorobanRpc.Server")
                ) {
                    rpcDetected = true;
                }

                // Detect transaction submission
                if (content.includes("submitTransaction")) {
                    submitDetected = true;
                }

                // Detect simulation
                if (content.includes("simulateTransaction")) {
                    simulateDetected = true;
                }
            }
        }
    }

    scanDirectory(scanPath);

    items.push({
        title: "Stellar SDK",
        status: stellarSdkDetected ? "success" : "error",
        message: stellarSdkDetected
            ? "Stellar SDK detected"
            : "Stellar SDK not found"
    });

    items.push({
        title: "Horizon Client",
        status: horizonDetected ? "success" : "warning",
        message: horizonDetected
            ? "Horizon client detected"
            : "Horizon client not detected"
    });

    items.push({
        title: "Soroban RPC",
        status: rpcDetected ? "success" : "warning",
        message: rpcDetected
            ? "Soroban RPC client detected"
            : "Soroban RPC client not detected"
    });

    items.push({
        title: "submitTransaction",
        status: submitDetected ? "success" : "warning",
        message: submitDetected
            ? "Transaction submission detected"
            : "submitTransaction() not used"
    });

    items.push({
        title: "simulateTransaction",
        status: simulateDetected ? "success" : "info",
        message: simulateDetected
            ? "Transaction simulation detected"
            : "simulateTransaction() not used"
    });

    return {
        name: "Stellar Integration Validation",
        items
    };
}