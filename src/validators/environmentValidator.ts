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
                    title: ".env file",
                    status: "error",
                    message: ".env file is required but not found"
                }
            ]
        };
    }
    const envContent = fs.readFileSync(".env", "utf-8");
    const requiredVars = ["CONTRACT_ID", "RPC_URL", ];
    for (const variable of requiredVars) {
        const exists= envContent.includes(`${variable}=`);
        items.push({
            title: variable,
            status: exists ? "success" : "error",
            message: exists ? "Configured" : "Missing from .env file"
        });
    }
    return {
        name: "Environment Validation",
        items
    };
} catch (error) {
    console.error(`Error validating environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
        name: "Environment Validation",
        items: [
            {
                title: "Environment Validation",
                status: "error",
                message: "An error occurred during validation"
            }
        ]
    };
}
}