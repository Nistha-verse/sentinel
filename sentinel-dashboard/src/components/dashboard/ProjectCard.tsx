"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileCode2, LayoutDashboard, Percent } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { EnrichedProject } from "@/lib/discovered-contract-types";
import { SELECTED_CONTRACT_KEY } from "@/lib/discovered-contract-types";

interface ProjectCardProps {
  project: EnrichedProject;
  index?: number;
}

function healthBadgeVariant(
  status: EnrichedProject["healthStatus"]
): "success" | "warning" | "critical" | "secondary" {
  switch (status) {
    case "healthy":
      return "success";
    case "warning":
      return "warning";
    case "critical":
      return "critical";
    default:
      return "secondary";
  }
}

function handleOpenDashboard(contractId: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SELECTED_CONTRACT_KEY, contractId);
  }
}

export default function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card className="h-full border-primary/15 transition-colors hover:border-primary/30">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                <FileCode2 size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-label text-muted-foreground">Soroban contract</p>
                <h3 className="mt-1 truncate text-base font-semibold text-foreground">
                  {project.displayName}
                </h3>
                <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                  {project.contractId}
                </p>
              </div>
            </div>

            <Badge variant={healthBadgeVariant(project.healthStatus)}>
              {project.healthLabel}
            </Badge>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{project.networkLabel}</Badge>
            {project.deployedByWallet && (
              <Badge variant="secondary">Deployed by wallet</Badge>
            )}
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Last scan</dt>
              <dd className="text-right font-medium text-foreground">
                {project.lastScanStatus ?? "Not scanned"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <Percent size={14} />
                Coverage
              </dt>
              <dd className="font-medium text-foreground">
                {project.coveragePercent !== null
                  ? `${project.coveragePercent}%`
                  : "—"}
              </dd>
            </div>
          </dl>

          {project.coveragePercent !== null && (
            <div className="mt-3">
              <Progress
                value={project.coveragePercent}
                label="Function coverage"
                animated={false}
                barClassName="bg-success"
              />
            </div>
          )}

          <div className="mt-auto pt-5">
            <Button
              className="w-full"
              onClick={() => handleOpenDashboard(project.contractId)}
              asChild
            >
              <Link href="/dashboard">
                <LayoutDashboard size={14} />
                Open Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
