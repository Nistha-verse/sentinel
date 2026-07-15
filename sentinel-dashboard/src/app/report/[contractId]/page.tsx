"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertOctagon,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Calendar,
  Globe,
  Hash,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

import AppLayout from "@/components/layout/Applayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CountUp } from "@/components/ui/count-up";
import { useToast } from "@/components/ui/toast";
import { fetchRawReport, startScan, pollScan, type RawReport } from "@/services/scanApi";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium" | "low" | "info";

interface Finding {
  detector: string;
  title: string;
  severity: Severity;
  confidence: "high" | "medium" | "low";
  description: string;
  recommendation: string;
  evidence?: string;
  affectedFunction?: string;
}

// ─── Helper components ────────────────────────────────────────────────────────

function severityVariant(s: Severity): "critical" | "warning" | "info" | "success" | "secondary" {
  switch (s) {
    case "critical": return "critical";
    case "high":     return "critical";
    case "medium":   return "warning";
    case "low":      return "warning";
    case "info":     return "info";
  }
}

function severityColor(s: Severity): string {
  switch (s) {
    case "critical": return "text-critical";
    case "high":     return "text-critical";
    case "medium":   return "text-warning";
    case "low":      return "text-warning";
    case "info":     return "text-info";
  }
}

function RiskShield({ score }: { score: number }) {
  if (score >= 60) return <ShieldX    size={28} className="text-critical" />;
  if (score >= 20) return <ShieldAlert size={28} className="text-warning" />;
  return                  <ShieldCheck size={28} className="text-success" />;
}

function riskLabel(score: number): { label: string; variant: "critical" | "warning" | "success" } {
  if (score >= 80) return { label: "CRITICAL", variant: "critical" };
  if (score >= 60) return { label: "HIGH",     variant: "critical" };
  if (score >= 40) return { label: "MEDIUM",   variant: "warning" };
  if (score >= 20) return { label: "LOW",      variant: "warning" };
  return                  { label: "SAFE",     variant: "success" };
}

const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "low", "info"];
const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
  low:      "Low",
  info:     "Info",
};

function FindingCard({ finding, index }: { finding: Finding; index: number }) {
  const [open, setOpen] = useState(index < 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-lg border border-border bg-card overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-hover"
      >
        <div className="mt-0.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-sm font-semibold ${severityColor(finding.severity)}`}>
              {finding.title}
            </span>
            <Badge variant={severityVariant(finding.severity)}>
              {SEVERITY_LABELS[finding.severity]}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {finding.confidence} confidence
            </Badge>
            {finding.affectedFunction && (
              <Badge variant="outline" className="font-mono text-[10px]">
                {finding.affectedFunction}
              </Badge>
            )}
          </div>
          {!open && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {finding.description}
            </p>
          )}
        </div>
        <span className="shrink-0 mt-0.5 text-muted-foreground">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
              <div>
                <p className="text-label text-muted-foreground">Description</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  {finding.description}
                </p>
              </div>

              <div>
                <p className="text-label text-muted-foreground">Recommendation</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  {finding.recommendation}
                </p>
              </div>

              {finding.evidence && (
                <div>
                  <p className="text-label text-muted-foreground">Evidence</p>
                  <code className="mt-1 block rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-foreground">
                    {finding.evidence}
                  </code>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                <span className="text-xs text-muted-foreground">
                  Detector: <span className="font-mono text-foreground">{finding.detector}</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportDetailPage() {
  const params = useParams();
  const contractId = Array.isArray(params.contractId)
    ? params.contractId[0]
    : (params.contractId ?? "");

  const { toast } = useToast();

  const [report, setReport]     = useState<RawReport | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);
  const [activeSev, setActiveSev] = useState<Severity | "all">("all");
  const [scanning, setScanning] = useState(false);

  const loadReport = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRawReport(contractId);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(contractId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    link.download = `${contractId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRescan = useCallback(async () => {
    if (!report) return;
    setScanning(true);
    try {
      const { scanId } = await startScan(
        contractId,
        (report.network === "mainnet" ? "mainnet" : "testnet") as "testnet" | "mainnet"
      );
      let done = false;
      while (!done) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await pollScan(scanId);
        if (status.status === "complete") {
          done = true;
          toast({ variant: "success", message: "Re-scan complete", description: `Risk score: ${status.result?.riskScore ?? "?"}/100` });
          await loadReport();
        } else if (status.status === "error") {
          done = true;
          toast({ variant: "error", message: "Re-scan failed", description: status.error });
        }
      }
    } catch (err) {
      toast({ variant: "error", message: "Re-scan failed", description: err instanceof Error ? err.message : undefined });
    } finally {
      setScanning(false);
    }
  }, [report, contractId, toast, loadReport]);

  // ── Derived values ──────────────────────────────────────────────────────────

  const findings: Finding[] = useMemo(
    () => (report?.findings ?? []) as Finding[],
    [report]
  );

  const counts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) c[f.severity] = (c[f.severity] ?? 0) + 1;
    return c;
  }, [findings]);

  const visibleFindings = useMemo(
    () => (activeSev === "all" ? findings : findings.filter((f) => f.severity === activeSev)),
    [findings, activeSev]
  );

  const riskInfo = report ? riskLabel(report.riskScore) : null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">

        {/* Back nav */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/history">
              <ArrowLeft size={14} />
              Back to history
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="space-y-6">
            <div className="space-y-3">
              <SkeletonBlock className="h-8 w-64" />
              <SkeletonBlock className="h-4 w-96" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonBlock key={i} className="h-28" />
              ))}
            </div>
            <SkeletonBlock className="h-48" />
          </div>
        )}

        {error && !loading && (
          <Card className="border-critical/30">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <ShieldX size={36} className="text-critical" />
              <div>
                <p className="font-semibold text-foreground">Report not found</p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => void loadReport()}>Try again</Button>
                <Button asChild><Link href="/history">Back to history</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && report && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Page header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-label text-muted-foreground">Security Report</p>
                <h1 className="mt-1 text-h2 text-foreground">{report.contractName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Globe size={13} />
                    {report.network}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {new Date(report.timestamp).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopyId()}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-0.5 font-mono text-[11px] transition hover:bg-hover"
                    title="Click to copy"
                  >
                    <Hash size={11} />
                    {contractId.slice(0, 8)}…{contractId.slice(-8)}
                    {copied
                      ? <Check size={11} className="text-success" />
                      : <Copy size={11} />
                    }
                  </button>
                  <Badge variant="secondary" className="text-[10px]">
                    by {report.scannedBy}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleRescan()}
                  disabled={scanning}
                  className="gap-2"
                >
                  {scanning
                    ? <Loader2 size={13} className="animate-spin" />
                    : <RefreshCw size={13} />
                  }
                  {scanning ? "Scanning…" : "Re-scan"}
                </Button>
                <Button size="sm" onClick={handleDownload} className="gap-2">
                  <Download size={13} />
                  Download JSON
                </Button>
              </div>
            </div>

            {/* Risk summary card */}
            <Card className={`border-${riskInfo?.variant === "critical" ? "critical" : riskInfo?.variant === "warning" ? "warning" : "success"}/30`}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <RiskShield score={report.riskScore} />
                    <div>
                      <p className="text-label text-muted-foreground">Risk Score</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-semibold text-foreground tabular-nums">
                          <CountUp value={report.riskScore} />
                        </span>
                        <span className="text-lg text-muted-foreground">/100</span>
                      </div>
                      {riskInfo && (
                        <Badge variant={riskInfo.variant} className="mt-1">
                          {riskInfo.label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 sm:ml-auto">
                    {(["critical", "high", "medium", "low"] as const).map((sev) => (
                      <div key={sev} className="text-center">
                        <p className={`text-2xl font-semibold tabular-nums ${severityColor(sev)}`}>
                          {report[sev]}
                        </p>
                        <p className="text-xs capitalize text-muted-foreground">{sev}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <Progress
                    value={report.riskScore}
                    label="Risk level"
                    barClassName={
                      report.riskScore >= 60 ? "bg-critical" :
                      report.riskScore >= 20 ? "bg-warning"  : "bg-success"
                    }
                  />
                </div>

                {report.wasmHash && (
                  <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                    WASM hash: {report.wasmHash}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Findings section */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-foreground">
                  Findings <span className="text-muted-foreground">({findings.length})</span>
                </h2>

                {/* Severity filter */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveSev("all")}
                    className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                      activeSev === "all"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    All ({findings.length})
                  </button>
                  {SEVERITY_ORDER.filter((s) => counts[s] > 0).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setActiveSev(sev)}
                      className={`rounded-md border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                        activeSev === sev
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {SEVERITY_LABELS[sev]} ({counts[sev]})
                    </button>
                  ))}
                </div>
              </div>

              {visibleFindings.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                    <ShieldCheck size={28} className="text-success" />
                    <p className="font-medium text-foreground">No findings for this filter</p>
                    <p className="text-sm text-muted-foreground">
                      {activeSev === "all"
                        ? "This contract has no security findings."
                        : `No ${activeSev} findings in this report.`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {visibleFindings.map((f, i) => (
                    <FindingCard
                      key={`${f.detector}-${f.title}-${i}`}
                      finding={f}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
