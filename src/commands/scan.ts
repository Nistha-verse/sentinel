import pc from "picocolors";
import { scanContract } from "../engine/scanEngine";
import { printScanResult, BANNER } from "../report";
import type { StellarNetwork } from "../rpc/stellar";

export interface ScanCommandOptions {
  network?: StellarNetwork;
  html?: boolean;
  rpcUrl?: string | undefined;
}

export async function runScan(
  contractId: string,
  options: ScanCommandOptions = {}
): Promise<void> {
  console.log(BANNER);

  const network = options.network ?? "testnet";

  console.log(`  ${pc.cyan("→")} Fetching contract metadata from ${pc.bold(network)}...`);
  console.log(`  ${pc.cyan("→")} Downloading WASM bytecode...`);

  const result = await scanContract(contractId, {
    network,
    ...(options.rpcUrl !== undefined ? { rpcUrl: options.rpcUrl } : {}),
    html: options.html ?? false,
  });

  printScanResult(result);

  // Exit code: 2 = critical findings, 1 = any findings, 0 = clean
  const { critical, high } = result.report;
  if (critical > 0) {
    process.exitCode = 2;
  } else if (high > 0) {
    process.exitCode = 1;
  }
}
