"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, Clock3, ArrowRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ReportsCardProps {
  hasReport?: boolean;
  reportName?: string;
  generatedAt?: string;
  healthScore?: number;
}

export default function ReportsCard({
  hasReport = false,
  reportName,
  generatedAt,
  healthScore,
}: ReportsCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="h-full transition-colors hover:border-primary/20 hover:bg-hover">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label text-muted-foreground">CLI Output</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                Validation Reports
              </h3>
            </div>
            <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted">
              <FileText size={15} className="text-primary" />
            </div>
          </div>

          <div className="mt-5">
            {hasReport ? (
              <>
                <div className="rounded-md border border-border bg-muted/50 p-4">
                  <p className="text-sm font-medium text-foreground">
                    {reportName}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 size={12} />
                    {generatedAt}
                  </div>
                  {healthScore !== undefined && (
                    <Badge variant="secondary" className="mt-3">
                      Health score: {healthScore}
                    </Badge>
                  )}
                </div>

                <Button size="sm" className="mt-4" asChild>
                  <Link href="/reports">
                    View full report
                    <ArrowRight size={14} />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-small font-medium text-text-secondary">
                  No reports available
                </p>
                <p className="mt-2 text-small leading-relaxed text-muted-foreground">
                  Import your first Sentinel CLI report to view validation
                  results and security findings.
                </p>

                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="/reports">Import Report</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
