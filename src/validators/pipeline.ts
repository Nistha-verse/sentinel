import * as path from "path";

import { validateProject } from "./projectValidator";
import { validateEnvironment } from "./environmentValidator";
import { validateUsage } from "./usageValidator";

import { scanTypeScript } from "../scanner/scanner";

import {
    parseWasm,
    ParsedContract
} from "../parser/wasmParser";

import { ValidationSection } from "../utils/types";

export interface LocalValidationPipelineResult {

    projectSection: ValidationSection;

    environmentSection: ValidationSection;

    usageSection: ValidationSection;

    scanResult: ReturnType<typeof scanTypeScript>;

    parsedContract: ParsedContract;

}

export function runLocalValidationPipeline(
    targetPath: string
): LocalValidationPipelineResult {

    const resolvedPath = path.resolve(targetPath);

    const previousCwd = process.cwd();

    try {

        process.chdir(resolvedPath);

        const projectSection =
            validateProject();

        const environmentSection =
            validateEnvironment();

        const scanResult =
            scanTypeScript(resolvedPath);

        if (!scanResult.wasmPath) {
            throw new Error(
                "Compiled WASM file not found. Build the contract before running Sentinel."
            );
        }

        const parsedContract =
            parseWasm(scanResult.wasmPath);

        const usageSection =
            validateUsage(
                parsedContract,
                scanResult.contractCalls
            );

        return {

            projectSection,

            environmentSection,

            usageSection,

            scanResult,

            parsedContract

        };

    } finally {

        process.chdir(previousCwd);

    }

}