"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Activity } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CountUp } from "@/components/ui/count-up";

interface HealthCardProps {
  healthScore?: number;
  coveragePercent?: number | null;
  status?: string;
  loading?: boolean;
}

export default function HealthCard({
  healthScore,
  coveragePercent,
  status,
  loading = false,
}: HealthCardProps) {
  const hasData = healthScore !== undefined && status !== undefined;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="h-full transition-colors hover:border-primary/20 hover:bg-hover">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label text-muted-foreground">Health</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                Project Health
              </h3>
            </div>
            <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted">
              <ShieldCheck size={15} className="text-primary" />
            </div>
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="space-y-2">
                <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-36 animate-pulse rounded-md bg-muted" />
              </div>
            ) : hasData ? (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-primary">
                    <CountUp value={healthScore} />
                  </span>
                  <span className="mb-1 text-lg text-muted-foreground">/100</span>
                </div>
                {coveragePercent !== null && coveragePercent !== undefined && (
                  <Progress
                    value={coveragePercent}
                    className="mt-4"
                    animated
                    label="Coverage"
                    barClassName="bg-success"
                  />
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Activity size={14} className="text-success" />
                  <span className="text-small font-medium text-foreground">
                    {status}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Badge variant="secondary" className="mb-3">
                  Awaiting scan
                </Badge>
                <Progress value={0} animated={false} label="Coverage" />
                <p className="mt-4 text-small leading-relaxed text-text-secondary">
                  Import a Sentinel CLI report to populate health and coverage
                  metrics.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
