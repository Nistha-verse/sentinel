import type { ScanHistoryEntry } from "@/lib/report-storage";
import type {
  DiscoveredContract,
  EnrichedProject,
  HealthStatus,
} from "@/lib/discovered-contract-types";

function historyToHealth(entry: ScanHistoryEntry): {
  status: HealthStatus;
  label: string;
} {
  switch (entry.status) {
    case "critical":
      return { status: "critical", label: "Validation failed" };
    case "warning":
      return { status: "warning", label: "Review recommended" };
    default:
      return { status: "healthy", label: "Healthy" };
  }
}

function formatActivityDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function findMatchingHistory(
  contract: DiscoveredContract,
  history: ScanHistoryEntry[]
): ScanHistoryEntry | null {
  if (history.length === 0) return null;

  // 1. Try matching by contract ID (most reliable)
  const byId = history.find(
    (entry) =>
      entry.contractId &&
      entry.contractId.toLowerCase() === contract.contractId.toLowerCase()
  );
  if (byId) return byId;

  // 2. Try matching by displayName/contractName
  const byName = history.find(
    (entry) =>
      entry.contractName.toLowerCase() === contract.displayName.toLowerCase()
  );
  if (byName) return byName;

  // 3. Fall back to single contract logic if appropriate
  if (history.length === 1 && contract.deployedByWallet) {
    return history[0];
  }

  return null;
}

export function enrichDiscoveredContracts(
  contracts: DiscoveredContract[],
  history: ScanHistoryEntry[] = [],
  _walletAddress: string | null = null
): EnrichedProject[] {
  return contracts.map((contract) => {
    const historyMatch = findMatchingHistory(contract, history);

    if (historyMatch) {
      const health = historyToHealth(historyMatch);
      return {
        ...contract,
        displayName: historyMatch.contractName || contract.displayName,
        lastScanStatus: historyMatch.scanTimestamp,
        coveragePercent: historyMatch.coveragePercent,
        healthStatus: health.status,
        healthLabel: health.label,
        riskScore: 100 - historyMatch.healthScore,
        findingsCount: historyMatch.totalIssues,
        criticalCount: historyMatch.criticalCount,
        warningCount: historyMatch.warningCount,
      };
    }

    return {
      ...contract,
      lastScanStatus: null,
      coveragePercent: null,
      healthStatus: "unknown" as HealthStatus,
      healthLabel: "Unscanned",
      riskScore: null,
      findingsCount: null,
      criticalCount: null,
      warningCount: null,
    };
  });
}

export function formatLastActivity(isoDate: string): string {
  return formatActivityDate(isoDate);
}
