import {ValidationItem, ValidationSection} from '../utils/types';
import{ContractSpec} from "../parser/contractParser";
export function validateUsage(contractSpec: ContractSpec, backendCalls: string[]): ValidationSection {
    const items: ValidationItem[] = [];
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
