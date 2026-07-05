import type { ScanHistoryEntry } from "@/lib/report-storage";
import { loadStoredReport, getHealthStatus } from "@/lib/report-storage";
import type {
  DiscoveredContract,
  EnrichedProject,
  HealthStatus,
} from "@/lib/discovered-contract-types";

function toHealthStatus(
  errors: number,
  warnings: number
): { status: HealthStatus; label: string } {
  if (errors > 0) {
    return { status: "critical", label: "Validation failed" };
  }
  if (warnings > 0) {
    return { status: "warning", label: "Review recommended" };
  }
  return { status: "healthy", label: "Healthy" };
}

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

  const byName = history.find(
    (entry) =>
      entry.contractName.toLowerCase() === contract.displayName.toLowerCase()
  );
  if (byName) return byName;

  if (history.length === 1 && contract.deployedByWallet) {
    return history[0];
  }

  return null;
}

export function enrichDiscoveredContracts(
  contracts: DiscoveredContract[],
  history: ScanHistoryEntry[] = []
): EnrichedProject[] {
  const stored = loadStoredReport();
  const reportMetrics = stored?.parsed ?? null;

  return contracts.map((contract) => {
    const historyMatch = findMatchingHistory(contract, history);
    const reportMatchesSingle =
      reportMetrics &&
      contracts.length === 1 &&
      (historyMatch?.contractName === reportMetrics.contractName ||
        contract.deployedByWallet);

    if (historyMatch) {
      const health = historyToHealth(historyMatch);
      return {
        ...contract,
        displayName: historyMatch.contractName || contract.displayName,
        lastScanStatus: historyMatch.scanTimestamp,
        coveragePercent: historyMatch.coveragePercent,
        healthStatus: health.status,
        healthLabel: health.label,
      };
    }

    if (reportMatchesSingle && reportMetrics) {
      const { summary } = reportMetrics;
      const health = toHealthStatus(summary.errors, summary.warnings);
      return {
        ...contract,
        displayName: reportMetrics.contractName || contract.displayName,
        lastScanStatus: reportMetrics.scanTimestamp,
        coveragePercent: reportMetrics.coveragePercent,
        healthStatus: health.status,
        healthLabel: getHealthStatus(summary.errors, summary.warnings),
      };
    }

    return {
      ...contract,
      lastScanStatus: null,
      coveragePercent: null,
      healthStatus: "unknown",
      healthLabel: "Unscanned",
    };
  });
}

export function formatLastActivity(isoDate: string): string {
  return formatActivityDate(isoDate);
}
