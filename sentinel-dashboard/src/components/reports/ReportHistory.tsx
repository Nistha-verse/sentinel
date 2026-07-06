"use client";

import { motion } from "framer-motion";
import { Calendar, FileText, Layers, Clock3 } from "lucide-react";

import type { LoadedReport } from "@/lib/report-storage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReportHistoryProps {
  reports: LoadedReport[];
  selectedReportId: string | null;
  onSelect: (reportId: string) => void;
  loading?: boolean;
  walletAddress: string;
}

function formatLocalDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ReportHistory({
  reports,
  selectedReportId,
  onSelect,
  loading = false,
  walletAddress,
}: ReportHistoryProps) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="h-full transition-colors hover:border-primary/20 hover:bg-hover">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-label text-muted-foreground">History</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                Scan reports
              </h3>
            </div>
            <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted">
              <Layers size={15} className="text-primary" />
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Wallet
            </p>
            <p className="mt-2 text-sm font-medium text-foreground break-all">
              {walletAddress}
            </p>
          </div>

          {loading ? (
            <div className="mt-6 space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl bg-muted"
                />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="mt-6 space-y-3 text-small text-muted-foreground">
              <p>No stored scans for this wallet.</p>
              <p>Import a Sentinel CLI report to begin tracking your contract scans.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {reports.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    selectedReportId === item.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.fileName}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.parsed.contractName}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.parsed.summary.errors > 0
                          ? "critical"
                          : item.parsed.summary.warnings > 0
                            ? "warning"
                            : "success"
                      }
                    >
                      {item.parsed.summary.errors > 0
                        ? "critical"
                        : item.parsed.summary.warnings > 0
                          ? "warning"
                          : "success"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
                    <div className="inline-flex items-center gap-1">
                      <Clock3 size={12} />
                      {formatLocalDate(item.importedAt)}
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <Calendar size={12} />
                      {item.parsed.scanTimestamp}
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <FileText size={12} />
                      {item.parsed.coveragePercent !== null ? `${item.parsed.coveragePercent}% coverage` : "Coverage unknown"}
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <span className="font-medium text-foreground">{item.parsed.summary.errors}</span> critical
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <span className="font-medium text-foreground">{item.parsed.summary.warnings}</span> warning
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <span className="font-medium text-foreground">{item.parsed.summary.info}</span> info
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
