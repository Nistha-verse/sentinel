import * as fs from "fs";

export interface ContractFunction {
    name: string;
    inputs: string[];
}

export interface ContractSpec {
    functions: ContractFunction[];
}

export function parseContractSpec(filePath: string): ContractSpec {
    const content = fs.readFileSync(filePath, "utf-8");

    const spec = JSON.parse(content);

    return {
        functions: spec.functions ?? []
    };
}