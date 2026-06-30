import * as fs from "fs";

export interface ContractFunction {
    name: string;
    inputs: string[];
}

export interface ContractSpec {
    functions: ContractFunction[];
}

export function parseContractSpec(filePath: string): ContractSpec {
    try {
        const content = fs.readFileSync(filePath, "utf-8");

        const spec = JSON.parse(content);
        if(!Array.isArray(spec.functions)) {
            throw new Error("Invalid contract spec: 'functions' must be an array");
        }

        return {
            functions: spec.functions 
        };
    } catch (error) {
        console.error(`Error parsing contract spec: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return {
            functions: []
        };
    }
}