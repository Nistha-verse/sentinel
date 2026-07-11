import * as fs from "fs";
import { ValidationSection, ValidationItem } from "../utils/types";

export function validateEnvironment(): ValidationSection {
    const items: ValidationItem[] = [];

    try {
        if (!fs.existsSync(".env")) {
            return {
                name: "Environment Validation",
                items: [
                    {
                        title: ".env",
                        status: "error",
                        message: ".env file not found",
                    },
                ],
            };
        }

        const envContent = fs.readFileSync(".env", "utf-8");

        const envMap = new Map<string, string>();

        for (const line of envContent.split("\n")) {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith("#")) continue;

            const [key, ...rest] = trimmed.split("=");
            if(!key) continue;

            envMap.set(key.trim(), rest.join("=").trim());
        }

        const required = [
            "RPC_URL",
        ];

        for (const key of required) {
            const value = envMap.get(key);

            items.push({
                title: key,
                status:
                    value && value.length > 0
                        ? "success"
                        : "error",
                message:
                    value && value.length > 0
                        ? "Configured"
                        : "Missing or empty",
            });
        }

        if (envMap.has("CONTRACT_ID")) {
            items.push({
                title: "CONTRACT_ID",
                status: "info",
                message: "Available for contract scan",
            });
        }

        return {
            name: "Environment Validation",
            items,
        };
    } catch {
        return {
            name: "Environment Validation",
            items: [
                {
                    title: "Environment",
                    status: "error",
                    message: "Failed to read .env",
                },
            ],
        };
    }
}