import { rpc, xdr, StrKey } from "@stellar/stellar-sdk";

export interface StellarContractSummary {
  contractId: string;
  contractName: string;
  network: string;
  wasmHash: string | undefined;
  notes: string[];
}

export type StellarNetwork = "testnet" | "mainnet" | "custom";

const RPC_URLS: Record<StellarNetwork, string> = {
  testnet: "https://soroban-testnet.stellar.org",
  mainnet: "https://mainnet.stellar.validationcloud.io/v1/XCSmR1QqLfRs73nG23SzvA",
  custom: "",
};

export class StellarRpcService {
  private readonly server: rpc.Server;
  private readonly networkName: string;

  constructor(rpcUrl?: string, network: StellarNetwork = "testnet") {
    const url = rpcUrl ?? process.env.STELLAR_RPC_URL ?? RPC_URLS[network];
    this.server = new rpc.Server(url);
    this.networkName = rpcUrl ? "custom" : network;
  }

  async getContractSummary(contractId: string): Promise<StellarContractSummary> {
    const notes: string[] = [];
    let wasmHash: string | undefined;
    const contractName = `Contract ${contractId.slice(0, 8)}`;

    try {
      const contractIdBytes = StrKey.decodeContract(contractId);

      // Build ledger key using factory methods (stellar-sdk v16 API)
      // Cast needed: StrKey.decodeContract returns Buffer but type def says Hash
      const contractAddress = xdr.ScAddress.scAddressTypeContract(
        contractIdBytes as unknown as Parameters<typeof xdr.ScAddress.scAddressTypeContract>[0]
      );

      const instanceKey = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
          contract: contractAddress,
          key: xdr.ScVal.scvLedgerKeyContractInstance(),
          durability: xdr.ContractDataDurability.persistent(),
        })
      );

      const response = await this.server.getLedgerEntries(instanceKey);

      if (response.entries && response.entries.length > 0) {
        const entry = response.entries[0];
        if (entry?.val) {
          try {
            const data = entry.val.contractData();
            const val = data.val();
            if (val.switch().value === xdr.ScValType.scvContractInstance().value) {
              const instance = val.instance();
              const exec = instance.executable();
              if (
                exec.switch().value ===
                xdr.ContractExecutableType.contractExecutableWasm().value
              ) {
                wasmHash = Buffer.from(exec.wasmHash()).toString("hex");
              }
            }
          } catch {
            // entry format differs — skip hash extraction
          }
        }
      }
    } catch (err) {
      notes.push(
        `RPC metadata fetch failed: ${err instanceof Error ? err.message : "unknown error"}`
      );
    }

    return {
      contractId,
      contractName,
      network: this.networkName,
      wasmHash,
      notes,
    };
  }
}
