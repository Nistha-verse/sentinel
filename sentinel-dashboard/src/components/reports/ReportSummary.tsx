"use client";

import { motion } from "framer-motion";
import {
  AlertOctagon,
  AlertTriangle,
  Calendar,
  FileCode2,
  Info,
  Percent,
  ShieldCheck,
} from "lucide-react";

import type { ParsedReport } from "@/lib/report-types";
import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { Progress } from "@/components/ui/progress";

interface ReportSummaryProps {
  report: ParsedReport;
  fileName?: string;
}

export default function ReportSummary({ report, fileName }: ReportSummaryProps) {
  const stats = [
    {
      label: "Health score",
      value: report.healthScore,
      suffix: "",
      icon: ShieldCheck,
      accent: "text-primary",
    },
    {
      label: "Coverage",
      value: report.coveragePercent,
      suffix: "%",
      icon: Percent,
      accent: "text-success",
    },
    {
      label: "Critical",
      value: report.summary.errors,
      suffix: "",
      icon: AlertOctagon,
      accent: "text-critical",
    },
    {
      label: "Warnings",
      value: report.summary.warnings,
      suffix: "",
      icon: AlertTriangle,
      accent: "text-warning",
    },
    {
      label: "Info",
      value: report.summary.info,
      suffix: "",
      icon: Info,
      accent: "text-info",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border bg-card p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-label text-muted-foreground">Contract</p>
            <h2 className="mt-1 flex items-center gap-2 text-h3 text-foreground">
              <FileCode2 size={20} className="text-primary" />
              {report.contractName}
            </h2>
            {fileName && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {fileName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 text-small text-text-secondary">
            <Calendar size={14} />
            {report.scanTimestamp}
          </div>
        </div>

        {report.coveragePercent !== null && (
          <div className="mt-6">
            <Progress
              value={report.coveragePercent}
              label="Function coverage"
              animated
              barClassName="bg-success"
            />
          </div>
        )}
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-label text-muted-foreground">
                      {stat.label}
                    </p>
                    <Icon size={14} className="text-muted-foreground" />
                  </div>
                  <p className={`mt-2 text-2xl font-semibold ${stat.accent}`}>
                    {stat.value !== null ? (
                      <CountUp
                        value={stat.value}
                        suffix={stat.suffix}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
