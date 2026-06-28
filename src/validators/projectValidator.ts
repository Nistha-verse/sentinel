import * as fs from "fs";
import { ValidationSection, ValidationItem } from "../utils/types";

export function validateProject(): ValidationSection {
    const checks = [
        { name: "package.json", path: "package.json", required: true },
        { name: "tsconfig.json", path: "tsconfig.json", required: true },
        { name: "src", path: "src", required: true },
        { name: "contracts", path: "contracts", required: false },
        { name: ".env", path: ".env", required: false }
    ];

    const items: ValidationItem[] = [];

    for (const check of checks) {
        const exists = fs.existsSync(check.path);
        items.push({
            title: check.name,
            status: exists ? "success" : check.required ? "error" : "warning",
            message: exists ? "Found" : `${check.name} is ${check.required ? "required" : "optional"} but not found`
        });

    }

    return {
        name: "Project Structure",
        items
    };
}