import {ValidationItem, ValidationSection} from '../utils/types';
import{ContractSpec} from "../parser/contractParser";
export function validateUsage(contractSpec: ContractSpec, backendCalls: string[]): ValidationSection {
    const items: ValidationItem[] = [];
    try {
        if(contractSpec.functions.length === 0) {
            return {
                name: "Function Usage",
                items: [
                    {
                        title: "Function Usage",
                        status: "info",
                        message: "No functions found in contract"
                    }
                ]
            };
        }
    for (const func of contractSpec.functions) {
        const isUsed = backendCalls.includes(func.name);
        items.push({
            title: func.name,
            status: isUsed ? "success" : "warning",
            message: isUsed ? "Function is used in backend calls" : "Function exists in contract but not used in backend calls"
        });
    }
    return {
        name: "Function Usage",
        items
    };
}
 catch (error) {
    console.error(`Error validating function usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
        name: "Function Usage",
        items: [
            {
                title: "Function Usage",
                status: "error",
                message: "An error occurred during validation"
            }
        ]
    };
}
}