export type HealthStatus = "healthy" | "warning" | "critical" | "unknown";

export interface DiscoveredContract {
  contractId: string;
  displayName: string;
  network: string;
  networkLabel: string;
  lastActivity: string;
  deployedByWallet: boolean;
}

export interface EnrichedProject extends DiscoveredContract {
  lastScanStatus: string | null;
  coveragePercent: number | null;
  healthStatus: HealthStatus;
  healthLabel: string;
  riskScore: number | null;
  findingsCount: number | null;
  criticalCount: number | null;
  warningCount: number | null;
}

export interface DiscoveryCache {
  address: string;
  network: string;
  discoveredAt: string;
  contracts: DiscoveredContract[];
}

export const DISCOVERY_CACHE_PREFIX = "sentinel_discovered_contracts";
export const DISCOVERY_UPDATED_EVENT = "sentinel-discovery-updated";
export const SELECTED_CONTRACT_KEY = "sentinel_selected_contract";

export function discoveryCacheKey(address: string, network: string): string {
  return `${DISCOVERY_CACHE_PREFIX}_${address}_${network.toUpperCase()}`;
}

export function notifyDiscoveryUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DISCOVERY_UPDATED_EVENT));
  }
}
