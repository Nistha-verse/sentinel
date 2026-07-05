"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Trash2, Upload } from "lucide-react";

import AppLayout from "@/components/layout/Applayout";
import ReportImporter from "@/components/reports/ReportImporter";
import ReportSummary from "@/components/reports/ReportSummary";
import FindingsPanel from "@/components/reports/FindingsPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ParsedReport } from "@/lib/report-types";
import {
  clearStoredReport,
  loadStoredReport,
} from "@/lib/report-storage";
import { createSampleReport } from "@/lib/parse-report";

export default function ReportsPage() {
  const [report, setReport] = useState<ParsedReport | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);

  useEffect(() => {
    const stored = loadStoredReport();
    if (stored) {
      setReport(stored.parsed);
      setFileName(stored.fileName);
    }
  }, []);

  const handleImport = useCallback((parsed: ParsedReport, name: string) => {
    setReport(parsed);
    setFileName(name);
    setShowImporter(false);
  }, []);

  const handleClear = () => {
    clearStoredReport();
    setReport(null);
    setFileName(null);
    setShowImporter(false);
  };

  const handleDownloadSample = () => {
    const sample = createSampleReport();
    const blob = new Blob([JSON.stringify(sample, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "sentinel-report-sample.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-label text-muted-foreground">Validation</p>
            <h1 className="mt-1 text-h2 text-foreground">Reports</h1>
            <p className="mt-2 text-body text-text-secondary">
              Import a Sentinel CLI{" "}
              <code className="font-mono text-sm text-primary">report.json</code>{" "}
              to review contract health, coverage, and findings.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {report && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowImporter(true)}>
                  <Upload size={14} />
                  Replace
                </Button>
                <Button variant="outline" size="sm" onClick={handleClear}>
                  <Trash2 size={14} />
                  Clear
                </Button>
              </>
            )}
            {!report && (
              <Button size="sm" onClick={() => setShowImporter(true)}>
                <Upload size={16} />
                Import Report
              </Button>
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!report || showImporter ? (
            <motion.div
              key="importer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card className="border-dashed">
                <CardContent className="p-6">
                  <ReportImporter onImport={handleImport} />
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-6">
                    <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                      <Download size={14} />
                      Download sample report
                    </Button>
                    <Badge variant="secondary">
                      Matches Sentinel CLI JSON format
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <ReportSummary report={report} fileName={fileName ?? undefined} />
              <FindingsPanel report={report} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
