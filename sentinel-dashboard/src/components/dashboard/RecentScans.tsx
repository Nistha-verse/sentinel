"use client";

import Link from "next/link";
import { memo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock3,
  ExternalLink,
  RefreshCw,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useApiHistory, type HistoryEntry } from "@/hooks/useApiHistory";
import { startScan, pollScan } from "@/services/scanApi";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function RiskBadgeIcon({ entry }: { entry: HistoryEntry }) {
  if (entry.critical > 0 || entry.riskScore >= 60)
    return <ShieldX size={13} className="text-critical" />;
  if (entry.high > 0 || entry.riskScore >= 20)
    return <ShieldAlert size={13} className="text-warning" />;
  return <ShieldCheck size={13} className="text-success" />;
}

function riskVariant(entry: HistoryEntry): "critical" | "warning" | "success" {
  if (entry.critical > 0 || entry.riskScore >= 60) return "critical";
  if (entry.high > 0 || entry.riskScore >= 20)     return "warning";
  return "success";
}

const ScanRow = memo(function ScanRow({
  entry,
  index,
  onRescanDone,
}: {
  entry: HistoryEntry;
  index: number;
  onRescanDone: () => void;
}) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);

  const handleRescan = useCallback(async () => {
    setScanning(true);
    try {
      const { scanId } = await startScan(
        entry.contractId,
        (entry.network === "mainnet" ? "mainnet" : "testnet") as "testnet" | "mainnet"
      );
      let done = false;
      while (!done) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await pollScan(scanId);
        if (status.status === "complete") {
          done = true;
          toast({ variant: "success", message: "Re-scan complete", description: `${entry.contractName} — ${status.result?.riskScore ?? "?"}/100` });
          onRescanDone();
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
  }, [entry, toast, onRescanDone]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group flex items-center gap-3 border-l border-border py-2.5 pl-4 last:border-b-0 hover:bg-hover"
    >
      {/* timeline dot */}
      <span className="absolute -left-px size-1.5 -translate-x-1/2 rounded-full bg-primary" />

      <RiskBadgeIcon entry={entry} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{entry.contractName}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 size={11} />
          {formatDate(entry.timestamp)}
          <span className="mx-1 text-border">·</span>
          <span className="capitalize">{entry.network}</span>
        </p>
      </div>

      <Badge variant={riskVariant(entry)} className="shrink-0 text-[11px]">
        {entry.riskScore}/100
      </Badge>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          disabled={scanning}
          onClick={() => void handleRescan()}
          className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          title="Re-scan"
        >
          {scanning
            ? <Loader2 size={13} className="animate-spin" />
            : <RefreshCw size={13} />
          }
        </button>
        <Link
          href={`/report/${entry.contractId}`}
          className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title="View report"
        >
          <ExternalLink size={13} />
        </Link>
      </div>
    </motion.div>
  );
});

interface RecentScansProps {
  /** max rows to show (default 6) */
  limit?: number;
}

export default function RecentScans({ limit = 6 }: RecentScansProps) {
  const { history, loading, refresh } = useApiHistory({ pollingInterval: 30_000 });
  const recent = history.slice(0, limit);

  return (
    <Card className="h-full transition-colors hover:border-primary/20">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-label text-muted-foreground">Backend</p>
            <h3 className="mt-1 text-base font-semibold text-foreground">Recent Scans</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded p-1.5 text-muted-foreground transition hover:bg-hover hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted">
              <Clock3 size={15} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="relative mt-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <ShieldCheck size={24} className="text-muted-foreground/40" />
              <p className="text-small text-muted-foreground">No scans yet.</p>
              <Button size="sm" variant="outline" asChild>
                <Link href="/scan">Run first scan</Link>
              </Button>
            </div>
          ) : (
            <div className="relative space-y-0 border-l border-border">
              {recent.map((entry, i) => (
                <ScanRow
                  key={entry.contractId + entry.timestamp}
                  entry={entry}
                  index={i}
                  onRescanDone={() => void refresh()}
                />
              ))}
            </div>
          )}
        </div>

        {!loading && history.length > limit && (
          <div className="mt-4 border-t border-border pt-4">
            <Button variant="ghost" size="sm" className="w-full gap-2" asChild>
              <Link href="/history">
                View all {history.length} scans
                <ArrowRight size={13} />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
