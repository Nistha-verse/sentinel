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

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
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

export default function ProjectCard({
  project,
  index = 0,
  onScanComplete,
}: ProjectCardProps) {
  const { toast } = useToast();
  const [scanPhase, setScanPhase]   = useState<ScanPhase>("idle");
  const [scanProgress, setScanProgress] = useState(0);
  const [riskScore, setRiskScore]   = useState<number | null>(null);

  const handleScan = useCallback(async () => {
    setScanPhase("scanning");
    setScanProgress(5);
    setRiskScore(null);

    try {
      const { scanId } = await startScan(
        project.contractId,
        // EnrichedProject.network is the SentinelNetwork string ("TESTNET" | "PUBLIC")
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
          setRiskScore(score);
          setScanPhase("done");
          toast({
            variant: "success",
            message: "Scan complete",
            description: `${project.displayName} — risk score ${score}/100`,
          });
          onScanComplete?.();
        } else if (status.status === "error") {
          done = true;
          setScanPhase("error");
          toast({
            variant: "error",
            message: "Scan failed",
            description: status.error ?? "An unexpected error occurred.",
          });
        }
      }
    } catch (err) {
      setScanPhase("error");
      toast({
        variant: "error",
        message: "Scan failed",
        description: err instanceof Error ? err.message : "Failed to start scan.",
      });
    }
  }, [project, toast, onScanComplete]);

  const isScanning = scanPhase === "scanning";
  const showReport = scanPhase === "done" || project.lastScanStatus !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card className="h-full border-primary/15 transition-colors hover:border-primary/30">
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

            <Badge variant={healthBadgeVariant(project.healthStatus)}>
              {project.healthLabel}
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
                Risk {riskScore}/100
              </Badge>
            )}
          </div>

          {/* Stats */}
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Clock size={13} />
                Last scan
              </dt>
              <dd className="text-right font-medium text-foreground">
                {project.lastScanStatus ?? "Not scanned"}
              </dd>
            </div>
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
            <div className="mt-4">
              <Progress value={scanProgress} animated label="Scanning…" />
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
                  Scanning…
                </>
              ) : (
                <>
                  <ScanSearch size={13} />
                  Scan
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
