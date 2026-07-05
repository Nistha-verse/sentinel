"use client";

import { useRef, useState } from "react";
import { Upload, FileJson, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

import { parseReportFile, ReportParseError } from "@/lib/parse-report";
import type { ParsedReport } from "@/lib/report-types";
import { saveReport } from "@/lib/report-storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReportImporterProps {
  onImport: (report: ParsedReport, fileName: string) => void;
  className?: string;
}

export default function ReportImporter({
  onImport,
  className,
}: ReportImporterProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setError(null);
    setLoading(true);

    try {
      const { parsed, raw } = await parseReportFile(file);
      saveReport(file.name, raw);
      onImport(parsed, file.name);
    } catch (err) {
      setError(
        err instanceof ReportParseError
          ? err.message
          : "Failed to import report."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <motion.div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-primary/40"
        )}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg border border-border bg-card">
          {loading ? (
            <Upload size={20} className="animate-pulse text-primary" />
          ) : (
            <FileJson size={20} className="text-primary" />
          )}
        </div>

        <p className="mt-4 text-sm font-medium text-foreground">
          Drop your Sentinel CLI report here
        </p>
        <p className="mt-1 text-small text-text-secondary">
          Accepts <code className="font-mono text-primary">report.json</code> from
          a Sentinel scan
        </p>

        <Button
          className="mt-6"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={16} />
          {loading ? "Parsing…" : "Browse files"}
        </Button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-start gap-2 rounded-md border border-critical/30 bg-critical/10 p-3 text-small text-critical"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </motion.div>
      )}
    </div>
  );
}
