// Preserved for backward compatibility. Logic moved to individual detectors.
import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

export function runDetectors(_contract: ParsedContract): Finding[] {
  return [];
}
