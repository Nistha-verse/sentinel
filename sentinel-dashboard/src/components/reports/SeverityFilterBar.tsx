"use client";

import { cn } from "@/lib/utils";
import type { FindingSeverity, SeverityFilter } from "@/lib/report-types";

const FILTERS: { id: SeverityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
  { id: "info", label: "Info" },
];

interface SeverityFilterBarProps {
  value: SeverityFilter;
  onChange: (filter: SeverityFilter) => void;
  counts: Record<FindingSeverity, number> & { all: number };
}

export default function SeverityFilterBar({
  value,
  onChange,
  counts,
}: SeverityFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((filter) => {
        const count =
          filter.id === "all" ? counts.all : counts[filter.id];
        const active = value === filter.id;

        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-muted/50 text-text-secondary hover:bg-hover hover:text-foreground"
            )}
          >
            {filter.label}
            <span className="ml-1.5 font-mono text-muted-foreground">
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
