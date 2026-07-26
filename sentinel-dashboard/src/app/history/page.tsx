"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  FileCode2,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
  Wifi,
  WifiOff,
  AlertCircle,
  ScanSearch,
  ChevronDown,
} from "lucide-react";

import AppLayout from "@/components/layout/Applayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useApiHistory, type HistoryEntry } from "@/hooks/useApiHistory";
import {
  startScan,
  pollScan,
  checkApiHealth,
  getReportHtmlUrl,
} from "@/services/scanApi";
import { useEffect, useRef, useState as useLocalState } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type SortField = "timestamp" | "riskScore" | "contractName" | "network";
type SortDir   = "asc" | "desc";
type SevFilter = "all" | "burnt" | "dark" | "medium" | "light" | "fresh";

function brewBadge(entry: HistoryEntry) {
  const { riskScore, critical, high } = entry;
  if (critical > 0 || riskScore >= 80)
    return { variant: "critical" as const, label: "Burnt Roast", icon: ShieldX };
  if (riskScore >= 60)
    return { variant: "critical" as const, label: "Dark Roast", icon: ShieldX };
  if (high > 0 || riskScore >= 40)
    return { variant: "warning" as const, label: "Medium Roast", icon: ShieldAlert };
  if (riskScore >= 20)
    return { variant: "warning" as const, label: "Light Roast", icon: ShieldAlert };
  return { variant: "success" as const, label: "Freshly Brewed", icon: ShieldCheck };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function matchesSevFilter(entry: HistoryEntry, f: SevFilter): boolean {
  if (f === "all") return true;
  if (f === "burnt") return entry.critical > 0 || entry.riskScore >= 80;
  if (f === "dark") return entry.riskScore >= 60 && entry.riskScore < 80 && entry.critical === 0;
  if (f === "medium") return (entry.high > 0 || entry.riskScore >= 40) && entry.riskScore < 60 && entry.critical === 0;
  if (f === "light") return entry.riskScore >= 20 && entry.riskScore < 40 && entry.critical === 0 && entry.high === 0;
  if (f === "fresh") return entry.riskScore < 20 && entry.critical === 0 && entry.high === 0;
  return true;
}

// Per-row rescan state
interface RescanState {
  phase: "idle" | "scanning" | "done" | "error";
}

// Download format
type DownloadFormat = "json" | "html";

// ─── Row component ────────────────────────────────────────────────────────────

function HistoryRow({
  entry,
  index,
  onRescanDone,
}: {
  entry: HistoryEntry;
  index: number;
  onRescanDone: () => void;
}) {
  const { toast } = useToast();
  const [state, setState] = useState<RescanState>({ phase: "idle" });
  const [downloading, setDownloading] = useState<DownloadFormat | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const badge = brewBadge(entry);
  const BadgeIcon = badge.icon;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    }
    if (showDownloadMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDownloadMenu]);

  const handleRescan = async () => {
    setState({ phase: "scanning" });
    try {
      const { scanId } = await startScan(
        entry.contractId,
        (entry.network === "mainnet" ? "mainnet" : "testnet") as "testnet" | "mainnet"
      );
      let done = false;
      while (!done) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await pollScan(scanId);
        if (status.status === "complete") {
          done = true;
          setState({ phase: "done" });
          toast({
            variant: "success",
            message: "Re-scan complete",
            description: `${entry.contractName} — risk ${status.result?.riskScore ?? "?"}/100`,
          });
          onRescanDone();
        } else if (status.status === "error") {
          done = true;
          setState({ phase: "error" });
          toast({ variant: "error", message: "Re-scan failed", description: status.error });
        }
      }
    } catch (err) {
      setState({ phase: "error" });
      toast({
        variant: "error",
        message: "Re-scan failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleDownloadJson = async () => {
    setDownloading("json");
    setShowDownloadMenu(false);
    try {
      // Use the /raw endpoint with ?download=1 for proper file download headers
      const url = `/api/report/${entry.contractId}/raw?download=1`;
      const res = await fetch(url);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        throw new Error(errBody.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${entry.contractId}.json`;
      a.click();
      URL.revokeObjectURL(objectUrl);
      toast({ variant: "success", message: "JSON report downloaded" });
    } catch (err) {
      toast({
        variant: "error",
        message: "JSON download failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadHtml = async () => {
    setDownloading("html");
    setShowDownloadMenu(false);
    try {
      const url = `/api/report/${entry.contractId}/html?download=1`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(text || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${entry.contractId}.html`;
      a.click();
      URL.revokeObjectURL(objectUrl);
      toast({ variant: "success", message: "HTML report downloaded" });
    } catch (err) {
      toast({
        variant: "error",
        message: "HTML download failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setDownloading(null);
    }
  };

  const isScanning = state.phase === "scanning";
  const isDownloading = downloading !== null;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="group border-b border-border last:border-0 hover:bg-hover"
    >
      {/* Contract */}
      <td className="py-2.5 pl-4 pr-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {entry.contractName}
          </p>
          <p
            className="mt-0.5 cursor-copy truncate font-mono text-[10px] text-muted-foreground"
            title={entry.contractId}
          >
            {entry.contractId.slice(0, 10)}…{entry.contractId.slice(-8)}
          </p>
        </div>
      </td>

      {/* Network */}
      <td className="px-3 py-2.5">
        <Badge variant="outline" className="capitalize whitespace-nowrap">
          {entry.network}
        </Badge>
      </td>

      {/* Date */}
      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(entry.timestamp)}
      </td>

      {/* Risk */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Badge variant={badge.variant} className="flex items-center gap-1 whitespace-nowrap">
            <BadgeIcon size={11} />
            {entry.riskScore}/100
          </Badge>
        </div>
      </td>

      {/* Severity counts */}
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs">
          {entry.critical > 0 && (
            <span className="font-semibold text-critical">{entry.critical}C</span>
          )}
          {entry.high > 0 && (
            <span className="font-semibold text-warning">{entry.high}H</span>
          )}
          {entry.medium > 0 && (
            <span className="text-warning">{entry.medium}M</span>
          )}
          {entry.low > 0 && (
            <span className="text-muted-foreground">{entry.low}L</span>
          )}
          {entry.critical === 0 && entry.high === 0 && entry.medium === 0 && entry.low === 0 && (
            <span className="text-success">Clean</span>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="py-2.5 pl-3 pr-4">
        <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          {/* Re-scan */}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isScanning || isDownloading}
            onClick={() => void handleRescan()}
            title="Re-scan"
          >
            {isScanning
              ? <Loader2 size={13} className="animate-spin" />
              : <RefreshCw size={13} />
            }
          </Button>

          {/* Download dropdown */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isDownloading || isScanning}
              onClick={() => setShowDownloadMenu((v) => !v)}
              title="Download report"
            >
              {isDownloading
                ? <Loader2 size={13} className="animate-spin" />
                : <Download size={13} />
              }
            </Button>

            <AnimatePresence>
              {showDownloadMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-card shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => void handleDownloadJson()}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-hover"
                  >
                    <Download size={13} className="text-muted-foreground" />
                    Download JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDownloadHtml()}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-hover"
                  >
                    <FileCode2 size={13} className="text-muted-foreground" />
                    Download HTML
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View report */}
          <Button variant="ghost" size="icon-sm" asChild title="View report">
            <Link href={`/report/${entry.contractId}`}>
              <ExternalLink size={13} />
            </Link>
          </Button>
        </div>
      </td>
    </motion.tr>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-border">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-4 animate-pulse rounded bg-muted" style={{ width: `${50 + (i * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

function MobileHistoryCard({
  entry,
  onRescanDone,
}: {
  entry: HistoryEntry;
  onRescanDone: () => void;
}) {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [downloading, setDownloading] = useState<"json" | "html" | null>(null);
  const badge = brewBadge(entry);
  const BadgeIcon = badge.icon;

  const handleRescan = async () => {
    setIsScanning(true);
    try {
      const { scanId } = await startScan(
        entry.contractId,
        (entry.network === "mainnet" ? "mainnet" : "testnet") as "testnet" | "mainnet"
      );
      let done = false;
      while (!done) {
        await new Promise((r) => setTimeout(r, 2000));
        const status = await pollScan(scanId);
        if (status.status === "complete") {
          done = true;
          toast({
            variant: "success",
            message: "Re-scan complete",
            description: `${entry.contractName} — brew score ${status.result?.riskScore ?? "?"}/100`,
          });
          onRescanDone();
        } else if (status.status === "error") {
          done = true;
          toast({ variant: "error", message: "Re-scan failed", description: status.error });
        }
      }
    } catch (err) {
      toast({
        variant: "error",
        message: "Re-scan failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownload = async (format: "json" | "html") => {
    setDownloading(format);
    try {
      const url = `/api/report/${entry.contractId}/${format === "json" ? "raw" : "html"}?download=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${entry.contractId}.${format}`;
      a.click();
      URL.revokeObjectURL(objectUrl);
      toast({ variant: "success", message: `${format.toUpperCase()} report downloaded` });
    } catch (err) {
      toast({
        variant: "error",
        message: `${format.toUpperCase()} download failed`,
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Card className="p-4 space-y-3 transition-colors hover:bg-hover">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{entry.contractName}</h4>
          <span className="font-mono text-[10px] text-muted-foreground break-all block mt-0.5">
            {entry.contractId.slice(0, 10)}…{entry.contractId.slice(-8)}
          </span>
        </div>
        <Badge variant={badge.variant} className="flex items-center gap-1 shrink-0">
          <BadgeIcon size={10} />
          {entry.riskScore}/100
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-2.5">
        <span className="capitalize px-1.5 py-0.5 rounded border border-border bg-muted/30">
          {entry.network}
        </span>
        <span>
          {formatDate(entry.timestamp)}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
        <div className="flex gap-2 text-xs">
          {entry.critical > 0 && <span className="font-semibold text-critical">{entry.critical}C</span>}
          {entry.high > 0 && <span className="font-semibold text-warning">{entry.high}H</span>}
          {entry.medium > 0 && <span className="text-warning">{entry.medium}M</span>}
          {entry.low > 0 && <span className="text-muted-foreground">{entry.low}L</span>}
          {entry.critical === 0 && entry.high === 0 && entry.medium === 0 && entry.low === 0 && (
            <span className="text-success">Clean</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" disabled={isScanning} onClick={handleRescan} title="Re-scan">
            {isScanning ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={downloading !== null} onClick={() => handleDownload("json")} title="Download JSON">
            {downloading === "json" ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          </Button>
          <Button variant="ghost" size="icon-sm" disabled={downloading !== null} onClick={() => handleDownload("html")} title="Download HTML">
            {downloading === "html" ? <Loader2 size={12} className="animate-spin" /> : <FileCode2 size={12} />}
          </Button>
          <Button variant="ghost" size="icon-sm" asChild title="View report">
            <Link href={`/report/${entry.contractId}`}>
              <ExternalLink size={12} />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { history, loading, error, refresh } = useApiHistory({ pollingInterval: 15_000 });
  const { toast } = useToast();
  const [apiOnline, setApiOnline]   = useState<boolean | null>(null);
  const [search, setSearch]         = useState("");
  const [sevFilter, setSevFilter]   = useState<SevFilter>("all");
  const [sortField, setSortField]   = useState<SortField>("timestamp");
  const [sortDir, setSortDir]       = useState<SortDir>("desc");

  // Check API health once on mount
  useEffect(() => {
    checkApiHealth().then(setApiOnline);
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return history
      .filter((e) => {
        if (q && !e.contractName.toLowerCase().includes(q) && !e.contractId.toLowerCase().includes(q)) {
          return false;
        }
        return matchesSevFilter(e, sevFilter);
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case "timestamp":    cmp = a.timestamp.localeCompare(b.timestamp); break;
          case "riskScore":    cmp = a.riskScore - b.riskScore; break;
          case "contractName": cmp = a.contractName.localeCompare(b.contractName); break;
          case "network":      cmp = a.network.localeCompare(b.network); break;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [history, search, sevFilter, sortField, sortDir]);

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-muted-foreground/50" />;
    return sortDir === "asc"
      ? <ArrowUp   size={12} className="text-primary" />
      : <ArrowDown size={12} className="text-primary" />;
  }

  function SortHeader({ field, label }: { field: SortField; label: string }) {
    return (
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        {label}
        <SortIcon field={field} />
      </button>
    );
  }

  const filterLabels: Record<SevFilter, string> = {
    all: "All",
    burnt: "Burnt Roast",
    dark: "Dark Roast",
    medium: "Medium Roast",
    light: "Light Roast",
    fresh: "Freshly Brewed",
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-label text-muted-foreground">Security</p>
            <h1 className="mt-1 text-h2 text-foreground">☕ Brew History</h1>
            <p className="mt-2 text-body text-text-secondary">
              Every brew from the CLI and dashboard in one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {apiOnline === false && (
              <span className="flex items-center gap-1.5 text-xs text-warning">
                <WifiOff size={13} /> API offline
              </span>
            )}
            {apiOnline === true && (
              <span className="flex items-center gap-1.5 text-xs text-success">
                <Wifi size={13} /> Connected
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={loading}
              className="gap-2"
            >
              {loading
                ? <Loader2 size={13} className="animate-spin" />
                : <RefreshCw size={13} />
              }
              Refresh
            </Button>
            <Button size="sm" asChild className="gap-2">
              <Link href="/scan">
                <ScanSearch size={13} />
                New brew
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3"
          >
            <AlertCircle size={15} className="shrink-0 text-warning" />
            <p className="text-sm text-warning">{error}</p>
          </motion.div>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or contract ID…"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Severity filter */}
          <div className="flex flex-wrap gap-1.5">
            {(["all", "burnt", "dark", "medium", "light", "fresh"] as SevFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setSevFilter(f)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  sevFilter === f
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        {!loading && (
          <p className="mb-3 text-xs text-muted-foreground">
            {filtered.length} of {history.length} brew{history.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Mobile View (< 640px) */}
        <div className="space-y-4 block sm:hidden">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="p-4 space-y-3">
                <div className="h-4 animate-pulse rounded bg-muted w-1/3" />
                <div className="h-6 animate-pulse rounded bg-muted w-1/2" />
                <div className="h-4 animate-pulse rounded bg-muted w-2/3" />
              </Card>
            ))
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <div className="flex flex-col items-center gap-4 py-8">
                <span className="text-4xl">☕</span>
                <h3 className="text-lg font-semibold text-foreground">
                  {history.length === 0 ? "No brews yet." : "No results found."}
                </h3>
                <p className="max-w-xs text-sm text-muted-foreground">
                  {history.length === 0 
                    ? "Connect your wallet and brew your first security analysis."
                    : "No results match your filters."
                  }
                </p>
                {history.length === 0 && (
                  <Button size="sm" asChild className="mt-2">
                    <Link href="/scan">Brew first contract</Link>
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            filtered.map((entry, i) => (
              <MobileHistoryCard
                key={entry.contractId}
                entry={entry}
                onRescanDone={() => void refresh()}
              />
            ))
          )}
        </div>

        {/* Desktop View (>= 640px) */}
        <Card className="hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="py-3 pl-4 pr-3">
                    <SortHeader field="contractName" label="Contract" />
                  </th>
                  <th className="px-3 py-3">
                    <SortHeader field="network" label="Network" />
                  </th>
                  <th className="px-3 py-3">
                    <SortHeader field="timestamp" label="Date" />
                  </th>
                  <th className="px-3 py-3">
                    <SortHeader field="riskScore" label="☕ Brew Score" />
                  </th>
                  <th className="px-3 py-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Findings
                    </span>
                  </th>
                  <th className="py-3 pl-3 pr-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="sync">
                  {loading
                    ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                    : filtered.length === 0
                      ? (
                        <tr>
                          <td colSpan={6} className="py-16 text-center">
                            <div className="flex flex-col items-center gap-4 py-8">
                              <span className="text-4xl">☕</span>
                              <h3 className="text-lg font-semibold text-foreground">
                                {history.length === 0 ? "No brews yet." : "No results match your filters."}
                              </h3>
                              <p className="max-w-xs text-sm text-muted-foreground">
                                {history.length === 0 
                                  ? "Connect your wallet and brew your first security analysis."
                                  : "Try adjusting your search query or severity filters."
                                }
                              </p>
                              {history.length === 0 && (
                                <Button size="sm" asChild className="mt-2">
                                  <Link href="/scan">Brew first contract</Link>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                      : filtered.map((entry, i) => (
                        <HistoryRow
                          key={entry.contractId}
                          entry={entry}
                          index={i}
                          onRescanDone={() => void refresh()}
                        />
                      ))
                  }
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
