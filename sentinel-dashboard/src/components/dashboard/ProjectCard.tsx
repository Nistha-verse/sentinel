"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  FileCode2,
  Loader2,
  ScanSearch,
  ExternalLink,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { useWallet } from "@/context/WalletContext";
import { saveReport } from "@/lib/report-storage";
import type { EnrichedProject } from "@/lib/discovered-contract-types";
import { startScan, pollScan } from "@/services/scanApi";

interface ProjectCardProps {
  project: EnrichedProject;
  index?: number;
  onScanComplete?: () => void;
}

type ScanPhase = "idle" | "scanning" | "done" | "error";

function healthBadgeVariant(
  status: EnrichedProject["healthStatus"]
): "success" | "warning" | "critical" | "secondary" {
  switch (status) {
    case "healthy":  return "success";
    case "warning":  return "warning";
    case "critical": return "critical";
    default:         return "secondary";
  }
}

function RiskIcon({ score }: { score: number }) {
  if (score >= 60) return <ShieldX    size={14} className="text-critical" />;
  if (score >= 20) return <ShieldAlert size={14} className="text-warning" />;
  return                  <ShieldCheck size={14} className="text-success" />;
}

function riskBadgeVariant(score: number): "critical" | "warning" | "success" | "secondary" {
  if (score >= 60) return "critical";
  if (score >= 20) return "warning";
  if (score > 0)   return "success";
  return "secondary";
}

function getBrewingStatus(progress: number, phase: string): string {
  if (phase === "done" || progress >= 100) return "✓ Brew Complete";
  if (progress <= 25) return "☕ Grinding Beans...";
  if (progress <= 50) return "☕ Brewing Analysis...";
  if (progress <= 75) return "☕ Tasting Contract...";
  return "☕ Pouring Report...";
}

function getBrewScoreLabel(score: number): { label: string; variant: "success" | "warning" | "critical" } {
  if (score >= 80) return { label: "Burnt Roast", variant: "critical" };
  if (score >= 60) return { label: "Dark Roast", variant: "critical" };
  if (score >= 40) return { label: "Medium Roast", variant: "warning" };
  if (score >= 20) return { label: "Light Roast", variant: "warning" };
  return { label: "Freshly Brewed", variant: "success" };
}

function formatScanDate(iso: string | null) {
  if (!iso) return "Never Brewed";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ProjectCard({
  project,
  index = 0,
  onScanComplete,
}: ProjectCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { address } = useWallet();
  const [scanPhase, setScanPhase]   = useState<ScanPhase>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [riskScore, setRiskScore]   = useState<number | null>(project.riskScore ?? null);
  const [findingsCount, setFindingsCount] = useState<number | null>(project.findingsCount ?? null);
  const [lastScanStatus, setLastScanStatus] = useState<string | null>(project.lastScanStatus ?? null);

  const handleScan = useCallback(async () => {
    setScanPhase("scanning");
    setScanProgress(5);
    setRiskScore(null);

    toast({
      variant: "info",
      message: "Brewing started...",
    });

    try {
      const { scanId } = await startScan(
        project.contractId,
        (project.network === "PUBLIC" ? "mainnet" : "testnet") as "testnet" | "mainnet"
      );

      let done = false;
      while (!done) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await pollScan(scanId);
        setScanProgress(status.progress ?? 50);

        if (status.status === "complete") {
          done = true;
          const score = status.result?.riskScore ?? 0;
          const count = status.result?.findingsCount ?? 0;
          setRiskScore(score);
          setFindingsCount(count);
          
          const nowStr = new Date().toISOString();
          setLastScanStatus(nowStr);
          setScanPhase("done");

          // Sync with LocalStorage reports
          try {
            const reportRes = await fetch(`/api/report/${project.contractId}/json`);
            if (reportRes.ok) {
              const rawReport = await reportRes.json();
              rawReport.contractId = project.contractId;
              await saveReport(`${project.displayName}.report.json`, rawReport, address);
            }
          } catch (saveErr) {
            console.error("Failed to save report locally:", saveErr);
          }

          toast({
            variant: "success",
            message: "Brew complete successfully.",
            action: {
              label: "View Report",
              onClick: () => router.push(`/report/${project.contractId}`),
            },
          });
          onScanComplete?.();
        } else if (status.status === "error") {
          done = true;
          setScanPhase("error");
          toast({
            variant: "error",
            message: "Brew failed",
            description: status.error ?? "An unexpected error occurred.",
          });
        }
      }
    } catch (err) {
      setScanPhase("error");
      toast({
        variant: "error",
        message: "Brew failed",
        description: err instanceof Error ? err.message : "Failed to start brew.",
      });
    }
  }, [project, toast, address, router, onScanComplete]);

  const isScanning = scanPhase === "scanning";
  const showReport = scanPhase === "done" || project.lastScanStatus !== null;

  const getDisplayStatus = () => {
    if (scanPhase === "scanning") {
      return { label: getBrewingStatus(scanProgress, scanPhase), variant: "secondary" as const };
    }
    if (riskScore !== null) {
      const info = getBrewScoreLabel(riskScore);
      return { label: info.label, variant: info.variant };
    }
    if (project.healthLabel === "Unscanned" || !project.lastScanStatus) {
      return { label: "Never Brewed", variant: "secondary" as const };
    }
    if (project.healthStatus === "healthy") {
      return { label: "Freshly Brewed", variant: "success" as const };
    } else if (project.healthStatus === "warning") {
      return { label: "Medium Roast", variant: "warning" as const };
    } else if (project.healthStatus === "critical") {
      return { label: "Dark Roast", variant: "critical" as const };
    }
    return { label: "Never Brewed", variant: "secondary" as const };
  };
  const currentStatus = getDisplayStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full border-primary/15 transition-all-300 hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(28,22,18,0.55)]">
        <CardContent className="flex h-full flex-col p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                <FileCode2 size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-label text-muted-foreground">Soroban contract</p>
                <h3 className="mt-1 truncate text-base font-semibold text-foreground">
                  {project.displayName}
                </h3>
                <p
                  className="mt-0.5 cursor-copy truncate font-mono text-[11px] text-muted-foreground"
                  title={project.contractId}
                  onClick={() => {
                    void navigator.clipboard.writeText(project.contractId);
                    toast({ variant: "success", message: "Contract ID copied" });
                  }}
                >
                  {project.contractId.slice(0, 8)}…{project.contractId.slice(-8)}
                </p>
              </div>
            </div>

            <Badge variant={currentStatus.variant}>
              {currentStatus.label}
            </Badge>
          </div>

          {/* Meta badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{project.networkLabel}</Badge>
            {project.deployedByWallet && (
              <Badge variant="secondary">Deployed by wallet</Badge>
            )}
            {riskScore !== null && (
              <Badge variant={riskBadgeVariant(riskScore)} className="flex items-center gap-1">
                <RiskIcon score={riskScore} />
                ☕ Brew Score {riskScore}/100
              </Badge>
            )}
          </div>

          {/* Stats */}
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Clock size={13} />
                ☕ Last Brewed
              </dt>
              <dd className="text-right font-medium text-foreground">
                {lastScanStatus ? formatScanDate(lastScanStatus) : "Never Brewed"}
              </dd>
            </div>
            {findingsCount !== null && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Findings</dt>
                <dd className="font-medium text-foreground">
                  {findingsCount} {findingsCount === 1 ? "finding" : "findings"}
                </dd>
              </div>
            )}
            {project.coveragePercent !== null && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Coverage</dt>
                <dd className="font-medium text-foreground">
                  {project.coveragePercent}%
                </dd>
              </div>
            )}
          </dl>

          {project.coveragePercent !== null && (
            <div className="mt-3">
              <Progress
                value={project.coveragePercent}
                animated={false}
                barClassName="bg-success"
              />
            </div>
          )}

          {/* Scanning progress */}
          {isScanning && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <div className="steam-container">
                    <span className="steam-line" />
                    <span className="steam-line" />
                    <span className="steam-line" />
                  </div>
                  {getBrewingStatus(scanProgress, scanPhase)}
                </span>
                <span className="font-mono text-foreground">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} animated={false} barClassName="bg-primary" />
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto flex gap-2 pt-5">
            <Button
              className="flex-1 gap-2"
              disabled={isScanning}
              onClick={() => void handleScan()}
            >
              {isScanning ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Brewing...
                </>
              ) : (
                <>
                  <ScanSearch size={13} />
                  Brew Contract
                </>
              )}
            </Button>

            {showReport && (
              <Button variant="outline" size="default" className="flex-1 gap-2" asChild>
                <Link href={`/report/${project.contractId}`}>
                  <ExternalLink size={13} />
                  Report
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
