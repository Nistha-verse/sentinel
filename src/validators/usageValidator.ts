import { ValidationItem, ValidationSection } from "../utils/types";
import { ParsedContract } from "../parser/wasmParser";

export function validateUsage(
  contract: ParsedContract,
  backendCalls: string[]
): ValidationSection {
  const items: ValidationItem[] = [];

  try {
    const exportedNames = contract.exports
      .filter((e) => e.kind === "Func")
      .map((e) => e.name);

    if (exportedNames.length === 0) {
      return {
        name: "Contract Usage Validation",
        items: [
          {
            title: "Exports",
            status: "warning",
            message: "No exported contract methods found.",
          },
        ],
      };
    }

    for (const exportedMethod of exportedNames) {
      const used = backendCalls.includes(exportedMethod);
      items.push({
        title: exportedMethod,
        status: used ? "success" : "warning",
        message: used
          ? "Referenced by backend."
          : "Exported by contract but never referenced.",
      });
    }

    return { name: "Contract Usage Validation", items };
  } catch {
    return {
      name: "Contract Usage Validation",
      items: [
        {
          title: "Usage Validation",
          status: "error",
          message: "Failed to validate contract usage.",
        },
      ],
    };
  }
}
