"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Percent,
  ShieldCheck,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Upload,
  Clock3,
  Layers,
} from "lucide-react";

import AppLayout from "@/components/layout/Applayout";
import HealthCard from "@/components/dashboard/HealthCard";
import WalletCard from "@/components/dashboard/WalletCard";
import ReportsCard from "@/components/dashboard/ReportsCard";
import TimelineCard from "@/components/dashboard/TimelineCard";
import StatCard from "@/components/dashboard/StatCard";
import RecentContractCard from "@/components/dashboard/RecentContractCard";
import ProjectDiscovery from "@/components/dashboard/ProjectDiscovery";
import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import { useReportData } from "@/components/dashboard/useReportData";
import { useWallet } from "@/context/WalletContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReportFinding } from "@/lib/report-types";

const SEVERITY_GROUPS = [
  {
    key: "critical" as const,
    label: "Critical",
    variant: "critical" as const,
    description: "Errors requiring immediate attention",
  },
  {
    key: "warning" as const,
    label: "Warning",
    variant: "warning" as const,
    description: "Potential problems and unused functions",
  },
  {
    key: "info" as const,
    label: "Info",
    variant: "info" as const,
    description: "Suggestions and informational notes",
  },
];

function findingLabel(finding: ReportFinding): string {
  return `${finding.title} — ${finding.message}`;
}

export default function DashboardPage() {
  const { connected, address, network, loading: walletLoading } = useWallet();
  const { metrics, parsed, history, ready, hasReport } = useReportData();

  const stats = hasReport && metrics
    ? [
        {
          label: "Total scans",
          value: metrics.totalScans,
          suffix: "",
          icon: Clock3,
          sub: "Reports imported for wallet",
          accent: "text-primary",
        },
        {
          label: "Monitored contracts",
          value: metrics.totalContracts,
          suffix: "",
          icon: Layers,
          sub: "Unique contract scans",
          accent: "text-primary",
        },
        {
          label: "Coverage",
          value: metrics.coveragePercent,
          suffix: "%",
          icon: Percent,
          sub: "Called / total functions",
          accent: "text-primary",
        },
        {
          label: "Health score",
          value: metrics.healthScore,
          suffix: "",
          icon: ShieldCheck,
          sub: metrics.healthStatus,
          accent: "text-primary",
        },
        {
          label: "Total issues",
          value: metrics.totalIssues,
          suffix: "",
          icon: AlertCircle,
          sub: "Critical, warning, and info",
          accent: "text-foreground",
        },
        {
          label: "Critical",
          value: metrics.criticalCount,
          suffix: "",
          icon: AlertOctagon,
          sub: "Errors in validation",
          accent: "text-critical",
        },
        {
          label: "Warnings",
          value: metrics.warningCount,
          suffix: "",
          icon: AlertTriangle,
          sub: "Review recommended",
          accent: "text-warning",
        },
      ]
    : [];

  const severityGroups = parsed
    ? SEVERITY_GROUPS.map((group) => ({
        ...group,
        issues: parsed.findings[group.key].map(findingLabel),
      }))
    : SEVERITY_GROUPS.map((group) => ({ ...group, issues: [] as string[] }));

  const showEmptyState = ready && !hasReport && !walletLoading;

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-label text-muted-foreground">Overview</p>
          <h1 className="mt-1 text-h2 text-foreground">Monitoring Console</h1>
          <p className="mt-2 text-body text-text-secondary">
            {hasReport
              ? `Monitoring ${metrics?.contractName} from CLI validation data.`
              : connected
                ? "Discovering Soroban contracts from your connected wallet."
                : "Import a Sentinel CLI report to populate your security dashboard."}
          </p>
        </motion.div>

        {connected && (
          <div className="mb-8">
            <ProjectDiscovery />
          </div>
        )}

        {hasReport && metrics && (
          <div className="mb-6">
            <RecentContractCard metrics={metrics} />
          </div>
        )}

        {hasReport && stats.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} {...stat} index={index} />
            ))}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Issues by severity
              </h2>
              <Badge variant={hasReport ? "success" : "secondary"}>
                {hasReport ? "From CLI report" : "No report loaded"}
              </Badge>
            </div>

            {severityGroups.map((group, index) => (
              <motion.div
                key={group.key}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
              >
                <Card className="transition-colors hover:border-primary/15">
                  <CardContent className="p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant={group.variant}>{group.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {group.description}
                      </span>
                      {hasReport && (
                        <span className="ml-auto font-mono text-xs text-muted-foreground">
                          {group.issues.length}
                        </span>
                      )}
                    </div>

                    {group.issues.length > 0 ? (
                      <ul className="mt-4 space-y-2">
                        {group.issues.map((issue, i) => (
                          <li
                            key={i}
                            className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
                          >
                            {issue}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-small text-muted-foreground">
                        {hasReport
                          ? `No ${group.label.toLowerCase()} issues in this report.`
                          : `Import a CLI report to surface ${group.label.toLowerCase()} findings.`}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
            <HealthCard
              loading={!ready}
              healthScore={metrics?.healthScore}
              coveragePercent={metrics?.coveragePercent}
              status={metrics?.healthStatus}
            />
            <WalletCard
              connected={connected}
              address={address ?? undefined}
              network={network ?? undefined}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ReportsCard
            hasReport={hasReport}
            reportName={metrics?.fileName}
            generatedAt={metrics?.scanTimestamp}
            healthScore={metrics?.healthScore}
          />
          <TimelineCard history={history} />
        </div>

        {showEmptyState && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mt-6 border-dashed">
              <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    No report loaded
                  </h3>
                  <p className="mt-1 text-small text-text-secondary">
                    Import a Sentinel CLI report to populate coverage, health
                    score, issues, and scan history.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/reports">
                      <Upload size={14} />
                      Import Report
                    </Link>
                  </Button>
                  {!connected && (
                    <ConnectWalletButton
                      redirectTo="/dashboard"
                      size="default"
                      label="Connect Wallet"
                      variant="outline"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
