import type { ParsedContract } from "../parser/wasmParser";
import type { Finding } from "../utils/types";

export interface DetectorMeta {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface IDetector {
  readonly meta: DetectorMeta;
  run(contract: ParsedContract): Finding[];
}
