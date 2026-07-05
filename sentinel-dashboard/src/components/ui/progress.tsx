"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  animated?: boolean;
  label?: string;
}

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
  animated = true,
  label,
}: ProgressProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono tabular-nums text-foreground">
            {Math.round(percent)}%
          </span>
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        {animated ? (
          <motion.div
            className={cn("h-full rounded-full bg-primary", barClassName)}
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        ) : (
          <div
            className={cn("h-full rounded-full bg-primary", barClassName)}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
}
