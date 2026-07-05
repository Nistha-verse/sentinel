"use client";

import { motion } from "framer-motion";
import { Clock3, Activity } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ScanHistoryEntry } from "@/lib/report-storage";

interface TimelineEvent {
  title: string;
  time: string;
  status?: "success" | "warning" | "critical" | "info";
  subtitle?: string;
}

interface TimelineCardProps {
  events?: TimelineEvent[];
  history?: ScanHistoryEntry[];
}

const statusVariant = {
  success: "success",
  warning: "warning",
  critical: "critical",
  info: "info",
} as const;

function formatImportedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function historyToEvents(history: ScanHistoryEntry[]): TimelineEvent[] {
  return history.map((entry) => ({
    title: entry.contractName,
    time: entry.scanTimestamp,
    status: entry.status,
    subtitle: `Imported ${formatImportedAt(entry.importedAt)} · Health ${entry.healthScore}${entry.coveragePercent !== null ? ` · ${entry.coveragePercent}% coverage` : ""}`,
  }));
}

export default function TimelineCard({
  events = [],
  history,
}: TimelineCardProps) {
  const timelineEvents = history?.length ? historyToEvents(history) : events;
  const hasEvents = timelineEvents.length > 0;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="h-full transition-colors hover:border-primary/20 hover:bg-hover">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label text-muted-foreground">History</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                Recent Scans
              </h3>
            </div>
            <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted">
              <Clock3 size={15} className="text-primary" />
            </div>
          </div>

          <div className="mt-5">
            {hasEvents ? (
              <div className="space-y-0">
                {timelineEvents.map((event, index) => (
                  <div
                    key={`${event.title}-${event.time}-${index}`}
                    className="relative flex gap-3 border-l border-border py-3 pl-4 last:pb-0"
                  >
                    <span className="absolute -left-px top-4 size-1.5 -translate-x-1/2 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {event.title}
                        </p>
                        {event.status && (
                          <Badge
                            variant={statusVariant[event.status]}
                            className="shrink-0 text-[10px]"
                          >
                            {event.status}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {event.time}
                      </p>
                      {event.subtitle && (
                        <p className="mt-1 text-xs text-text-secondary">
                          {event.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Activity size={14} />
                  <span className="text-small font-medium">No scans yet</span>
                </div>
                <p className="mt-3 text-small leading-relaxed text-text-secondary">
                  Import a Sentinel CLI report to build your scan timeline.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
