"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import type {
  FindingSeverity,
  ParsedReport,
  ReportFinding,
  SeverityFilter,
} from "@/lib/report-types";
import { Badge } from "@/components/ui/badge";
import CollapsibleSection from "./CollapsibleSection";
import SeverityFilterBar from "./SeverityFilterBar";

const SEVERITY_CONFIG: Record<
  FindingSeverity,
  { label: string; variant: "critical" | "warning" | "info"; description: string }
> = {
  critical: {
    label: "Critical Issues",
    variant: "critical",
    description: "Errors that require immediate attention",
  },
  warning: {
    label: "Warning Issues",
    variant: "warning",
    description: "Potential problems and unused contract functions",
  },
  info: {
    label: "Informational Suggestions",
    variant: "info",
    description: "Optional improvements and informational notes",
  },
};

function FindingItem({
  finding,
  index,
}: {
  finding: ReportFinding;
  index: number;
}) {
  const config = SEVERITY_CONFIG[finding.severity];

  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-md border border-border bg-muted/20 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{finding.title}</p>
        <div className="flex items-center gap-2">
          <Badge variant={config.variant}>{config.label.split(" ")[0]}</Badge>
          <span className="text-xs text-muted-foreground">{finding.section}</span>
        </div>
      </div>
      <p className="mt-2 text-small leading-relaxed text-text-secondary">
        {finding.message}
      </p>
    </motion.li>
  );
}

interface FindingsPanelProps {
  report: ParsedReport;
}

export default function FindingsPanel({ report }: FindingsPanelProps) {
  const [filter, setFilter] = useState<SeverityFilter>("all");

  const counts = useMemo(
    () => ({
      critical: report.findings.critical.length,
      warning: report.findings.warning.length,
      info: report.findings.info.length,
      all:
        report.findings.critical.length +
        report.findings.warning.length +
        report.findings.info.length,
    }),
    [report]
  );

  const visibleSeverities = useMemo((): FindingSeverity[] => {
    if (filter === "all") return ["critical", "warning", "info"];
    return [filter];
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-foreground">Findings</h2>
        <SeverityFilterBar
          value={filter}
          onChange={setFilter}
          counts={counts}
        />
      </div>

      <div className="space-y-4">
        {visibleSeverities.map((severity) => {
          const config = SEVERITY_CONFIG[severity];
          const items = report.findings[severity];

          if (items.length === 0) {
            return (
              <CollapsibleSection
                key={severity}
                defaultOpen={false}
                count={0}
                title={
                  <div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                }
              >
                <p className="py-2 text-small text-muted-foreground">
                  No {severity} findings in this report.
                </p>
              </CollapsibleSection>
            );
          }

          return (
            <CollapsibleSection
              key={severity}
              count={items.length}
              defaultOpen={severity === "critical" || filter !== "all"}
              title={
                <div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              }
            >
              <ul className="space-y-3 pt-2">
                {items.map((finding, index) => (
                  <FindingItem
                    key={`${finding.section}-${finding.title}-${index}`}
                    finding={finding}
                    index={index}
                  />
                ))}
              </ul>
            </CollapsibleSection>
          );
        })}
      </div>

      {/* Raw sections collapsible */}
      <CollapsibleSection
        defaultOpen={false}
        count={report.sections.length}
        title={
          <span className="text-sm font-semibold text-foreground">
            Validation sections (raw)
          </span>
        }
      >
        <div className="space-y-4 pt-2">
          {report.sections.map((section) => (
            <div
              key={section.name}
              className="rounded-md border border-border bg-muted/10 p-4"
            >
              <p className="text-sm font-medium text-foreground">
                {section.name}
              </p>
              <ul className="mt-3 space-y-2">
                {section.items.map((item, i) => (
                  <li
                    key={`${item.title}-${i}`}
                    className="flex items-start justify-between gap-3 text-small"
                  >
                    <span className="text-text-secondary">{item.title}</span>
                    <Badge
                      variant={
                        item.status === "error"
                          ? "critical"
                          : item.status === "warning"
                            ? "warning"
                            : item.status === "info"
                              ? "info"
                              : item.status === "success"
                                ? "success"
                                : "secondary"
                      }
                    >
                      {item.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}
