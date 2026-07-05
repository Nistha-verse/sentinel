"use client";

import { motion } from "framer-motion";
import {
  FileCode2,
  AlertTriangle,
  AlertOctagon,
  Percent,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";

interface StatCardProps {
  label: string;
  value: number | null;
  suffix?: string;
  icon: LucideIcon;
  sub: string;
  accent?: string;
  index?: number;
}

export default function StatCard({
  label,
  value,
  suffix = "",
  icon: Icon,
  sub,
  accent,
  index = 0,
}: StatCardProps) {
  const hasValue = value !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Card className="transition-colors hover:border-primary/20 hover:bg-hover">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <p className="text-label text-muted-foreground">{label}</p>
            <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted">
              <Icon size={14} className="text-muted-foreground" />
            </div>
          </div>

          <p className={`mt-3 text-3xl font-semibold text-foreground ${accent ?? ""}`}>
            {hasValue ? (
              <CountUp value={value} suffix={suffix} />
            ) : (
              <span className="text-muted-foreground">--</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
