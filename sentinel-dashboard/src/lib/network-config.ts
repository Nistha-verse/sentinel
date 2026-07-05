export type SentinelNetwork = "TESTNET" | "PUBLIC";

export interface NetworkEndpoints {
  horizon: string;
  sorobanRpc: string;
  label: string;
}

export const NETWORK_ENDPOINTS: Record<SentinelNetwork, NetworkEndpoints> = {
  TESTNET: {
    horizon: "https://horizon-testnet.stellar.org",
    sorobanRpc: "https://soroban-testnet.stellar.org",
    label: "Testnet",
  },
  PUBLIC: {
    horizon: "https://horizon.stellar.com",
    sorobanRpc: "https://mainnet.sorobanrpc.com",
    label: "Mainnet",
  },
};

export function resolveNetwork(
  network: string | null
): SentinelNetwork | null {
  if (!network) return null;
  const upper = network.toUpperCase();
  if (upper === "TESTNET") return "TESTNET";
  if (upper === "PUBLIC" || upper === "MAINNET") return "PUBLIC";
  return null;
}

export function getNetworkEndpoints(
  network: string | null
): NetworkEndpoints | null {
  const resolved = resolveNetwork(network);
  if (!resolved) return null;
  return NETWORK_ENDPOINTS[resolved];
}
