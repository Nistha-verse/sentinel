"use client";

import { motion } from "framer-motion";
import { FileCode2, Calendar, Activity } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CountUp } from "@/components/ui/count-up";
import { Progress } from "@/components/ui/progress";
import type { DashboardMetrics } from "./useReportData";

interface RecentContractCardProps {
  metrics: DashboardMetrics;
}

export default function RecentContractCard({ metrics }: RecentContractCardProps) {
  const statusVariant =
    metrics.criticalCount > 0
      ? "critical"
      : metrics.warningCount > 0
        ? "warning"
        : "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-primary/20">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                <FileCode2 size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-label text-muted-foreground">
                  Recent contract scanned
                </p>
                <h3 className="mt-1 text-base font-semibold text-foreground">
                  {metrics.contractName}
                </h3>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {metrics.fileName}
                </p>
              </div>
            </div>

            <Badge variant={statusVariant}>{metrics.healthStatus}</Badge>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-small text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {metrics.scanTimestamp}
            </span>
            <span className="flex items-center gap-1.5">
              <Activity size={14} />
              Health{" "}
              <span className="font-semibold text-primary">
                <CountUp value={metrics.healthScore} />
              </span>
            </span>
          </div>

          {metrics.coveragePercent !== null && (
            <div className="mt-4">
              <Progress
                value={metrics.coveragePercent}
                label="Function coverage"
                animated
                barClassName="bg-success"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
