"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
  Search,
  Download,
  ExternalLink,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";

import AppLayout from "@/components/layout/Applayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  startScan,
  pollScan,
  fetchHistory,
  getReportHtmlUrl,
  getReportJsonUrl,
  checkApiHealth,
  type ScanStatusResponse,
  type HistoryEntry,
} from "@/services/scanApi";

type ScanPhase = "idle" | "scanning" | "complete" | "error";

function RiskBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge variant="critical">CRITICAL — {score}/100</Badge>;
  if (score >= 35) return <Badge variant="warning">HIGH — {score}/100</Badge>;
  if (score >= 10) return <Badge variant="warning">MEDIUM — {score}/100</Badge>;
  return <Badge variant="success">SAFE — {score}/100</Badge>;
}

function FindingRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
      <span className={`text-sm font-medium ${color}`}>{label}</span>
      <span className="font-mono text-sm font-semibold text-foreground">{count}</span>
    </div>
  );
}

export default function ScanPage() {
  const [contractId, setContractId] = useState("");
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [scanResult, setScanResult] = useState<ScanStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkApiHealth().then(setApiOnline);
    fetchHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const handleScan = useCallback(async () => {
    const id = contractId.trim();
    if (!id) return;
    setPhase("scanning");
    setError(null);
    setScanResult(null);

    try {
      const { scanId } = await startScan(id, network);

      pollRef.current = setInterval(async () => {
        try {
          const status = await pollScan(scanId);
          setScanResult(status);
          if (status.status === "complete") {
            stopPolling();
            setPhase("complete");
            fetchHistory().then(setHistory).catch(() => null);
          } else if (status.status === "error") {
            stopPolling();
            setPhase("error");
            setError(status.error ?? "Scan failed");
          }
        } catch (err) {
          stopPolling();
          setPhase("error");
          setError(err instanceof Error ? err.message : "Polling failed");
        }
      }, 2000);
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Failed to start scan");
    }
  }, [contractId, network, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const reset = () => {
    stopPolling();
    setPhase("idle");
    setScanResult(null);
    setError(null);
  };

  const result = scanResult?.result;

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-label text-muted-foreground">Security</p>
          <h1 className="mt-1 text-h2 text-foreground">Scan Contract</h1>
          <p className="mt-2 text-body text-text-secondary">
            Paste a Soroban contract ID to run a full security analysis.
          </p>
        </motion.div>

        {apiOnline === false && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3"
          >
            <WifiOff size={16} className="shrink-0 text-warning" />
            <p className="text-sm text-warning">
              Sentinel API server is offline. Start it with{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">npm run serve</code>{" "}
              in the sentinel directory.
            </p>
          </motion.div>
        )}

        {apiOnline === true && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 flex items-center gap-2 text-sm text-success"
          >
            <Wifi size={14} />
            <span>API server connected</span>
          </motion.div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Contract ID
                    </label>
                    <input
                      type="text"
                      value={contractId}
                      onChange={(e) => setContractId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && phase === "idle" && void handleScan()}
                      placeholder="C... (56-character Stellar contract address)"
                      disabled={phase === "scanning"}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Network
                    </label>
                    <div className="flex gap-2">
                      {(["testnet", "mainnet"] as const).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setNetwork(n)}
                          disabled={phase === "scanning"}
                          className={`rounded-md border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                            network === n
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                          }`}
                        >
                          {n.charAt(0).toUpperCase() + n.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {phase === "idle" || phase === "error" ? (
                      <Button
                        onClick={() => void handleScan()}
                        disabled={!contractId.trim() || apiOnline === false}
                        className="gap-2"
                      >
                        <Search size={14} />
                        Scan Contract
                      </Button>
                    ) : phase === "scanning" ? (
                      <Button disabled className="gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Scanning...
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={reset} className="gap-2">
                        Scan Another
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {phase === "scanning" && (
                <motion.div
                  key="scanning"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <Loader2 size={18} className="animate-spin text-primary" />
                        <span className="font-medium text-foreground">
                          {scanResult?.status === "running" ? "Analyzing contract..." : "Starting scan..."}
                        </span>
                        <span className="ml-auto font-mono text-sm text-muted-foreground">
                          {scanResult?.progress ?? 0}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          animate={{ width: `${scanResult?.progress ?? 10}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Downloading WASM → Parsing instructions → Running 15 detectors
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {phase === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="border-critical/30">
                    <CardContent className="flex items-start gap-3 p-6">
                      <AlertCircle size={18} className="mt-0.5 shrink-0 text-critical" />
                      <div>
                        <p className="font-medium text-foreground">Scan Failed</p>
                        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {phase === "complete" && result && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-3">
                        {result.critical > 0 ? (
                          <ShieldX size={20} className="text-critical" />
                        ) : result.high > 0 ? (
                          <ShieldAlert size={20} className="text-warning" />
                        ) : (
                          <ShieldCheck size={20} className="text-success" />
                        )}
                        <span className="font-semibold text-foreground">Scan Complete</span>
                        <div className="ml-auto">
                          <RiskBadge score={result.riskScore} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <FindingRow label="Critical" count={result.critical} color="text-critical" />
                        <FindingRow label="High" count={result.high} color="text-warning" />
                        <FindingRow label="Medium" count={result.medium} color="text-yellow-500" />
                        <FindingRow label="Low" count={result.low} color="text-blue-500" />
                        <div className="mt-3 flex items-center justify-between rounded-md border border-border px-3 py-2">
                          <span className="text-sm text-muted-foreground">Total findings</span>
                          <span className="font-mono text-sm font-semibold">{result.findingsCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <p className="mb-3 text-sm font-medium text-foreground">Reports</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            window.open(getReportHtmlUrl(scanResult?.contractId ?? ""), "_blank")
                          }
                        >
                          <ExternalLink size={13} />
                          View HTML Report
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={async () => {
                            const url = getReportJsonUrl(scanResult?.contractId ?? "");
                            const res = await fetch(url);
                            const blob = await res.blob();
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(blob);
                            a.download = `${scanResult?.contractId ?? "report"}.json`;
                            a.click();
                          }}
                        >
                          <Download size={13} />
                          Download JSON
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History sidebar */}
          <div>
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">Recent Scans</p>
                </div>
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No scans yet.</p>
                ) : (
                  <div className="space-y-2">
                    {history.slice(0, 10).map((entry) => (
                      <button
                        key={entry.contractId + entry.timestamp}
                        type="button"
                        onClick={() => setContractId(entry.contractId)}
                        className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-left transition hover:border-primary/30 hover:bg-muted/60"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-mono text-xs text-foreground">
                            {entry.contractId.slice(0, 12)}...
                          </span>
                          <span
                            className={`shrink-0 text-xs font-semibold ${
                              entry.riskScore >= 70
                                ? "text-critical"
                                : entry.riskScore >= 35
                                ? "text-warning"
                                : "text-success"
                            }`}
                          >
                            {entry.riskScore}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{entry.network}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            {entry.critical}C {entry.high}H {entry.medium}M
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
