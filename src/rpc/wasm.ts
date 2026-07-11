import { rpc } from "@stellar/stellar-sdk";
import * as fs from "fs";
import * as path from "path";
import type { StellarNetwork } from "./stellar";

export interface WasmFetchResult {
  filePath: string;
  source: string;
}

const RPC_URLS: Record<StellarNetwork, string> = {
  testnet: "https://soroban-testnet.stellar.org",
  mainnet: "https://mainnet.stellar.validationcloud.io/v1/XCSmR1QqLfRs73nG23SzvA",
  custom: "",
};

export async function fetchWasmForContract(
  contractId: string,
  network: StellarNetwork = "testnet",
  rpcUrl?: string
): Promise<WasmFetchResult> {
  const url =
    rpcUrl ??
    process.env.STELLAR_RPC_URL ??
    RPC_URLS[network];

  const server = new rpc.Server(url);
  const wasm = await server.getContractWasmByContractId(contractId);

  const tmpDir = path.resolve(process.cwd(), "tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, `${contractId}.wasm`);
  const bytes = wasm instanceof Uint8Array ? wasm : Uint8Array.from(wasm);
  fs.writeFileSync(filePath, Buffer.from(bytes));

  return { filePath, source: "rpc" };
}
