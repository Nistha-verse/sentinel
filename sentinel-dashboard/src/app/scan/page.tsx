"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  Wifi,
  WifiOff,
  History,
  Copy,
  Check,
} from "lucide-react";

import AppLayout from "@/components/layout/Applayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useWallet } from "@/context/WalletContext";
import { saveReport } from "@/lib/report-storage";
import { useRouter } from "next/navigation";
import {
  startScan,
  pollScan,
  checkApiHealth,
  type ScanStatusResponse,
} from "@/services/scanApi";

// ─── Soroban contract ID validation ──────────────────────────────────────────
// Stellar contract IDs: 'C' followed by 55 base32 chars (total 56)
const CONTRACT_ID_REGEX = /^C[A-Z2-7]{55}$/;

function validateContractId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Contract ID is required.";
  if (trimmed.length !== 56) return `Contract ID must be 56 characters (got ${trimmed.length}).`;
  if (!CONTRACT_ID_REGEX.test(trimmed)) return "Contract ID must start with 'C' and contain only uppercase A-Z and 2-7.";
  return null;
}

type ScanPhase = "idle" | "scanning" | "complete" | "error";

function getBrewingStatus(progress: number, phase: string): string {
  if (phase === "complete" || progress >= 100) return "✓ Brew Complete";
  if (progress <= 25) return "☕ Grinding Beans...";
  if (progress <= 50) return "☕ Brewing Analysis...";
  if (progress <= 75) return "☕ Tasting Contract...";
  return "☕ Pouring Report...";
}

function BrewRoastBadge({ score }: { score: number }) {
  if (score >= 80) return <Badge variant="critical">Burnt Roast — {score}/100</Badge>;
  if (score >= 60) return <Badge variant="critical">Dark Roast — {score}/100</Badge>;
  if (score >= 40) return <Badge variant="warning">Medium Roast — {score}/100</Badge>;
  if (score >= 20) return <Badge variant="warning">Light Roast — {score}/100</Badge>;
  return <Badge variant="success">Freshly Brewed — {score}/100</Badge>;
}

function FindingRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
      <span className={`text-sm font-medium ${color}`}>{label}</span>
      <span className="font-mono text-sm font-semibold text-foreground">{count}</span>
    </div>
  );
}

// Animated scan-line graphic
function ScanAnimation({ progress, phase }: { progress: number; phase: string }) {
  return (
    <div className="relative h-32 overflow-hidden rounded-md border border-border bg-muted/20 flex flex-col justify-center items-center">
      {/* grid lines */}
      <div className="absolute inset-0 opacity-20 pattern-grid" />

      {/* steam rising when brewing */}
      <div className="steam-container mb-1">
        <span className="steam-line" />
        <span className="steam-line" />
        <span className="steam-line" />
      </div>

      {/* animated scan line */}
      <motion.div
        className="absolute inset-x-0 h-px bg-primary shadow-[0_0_8px_2px_var(--primary)]"
        animate={{ top: ["5%", "95%", "5%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
      />

      {/* progress overlay */}
      <div className="flex flex-col items-center justify-center gap-1 z-10">
        <span className="font-mono text-lg font-bold text-primary">{progress}%</span>
        <span className="text-xs text-muted-foreground">{getBrewingStatus(progress, phase)}</span>
      </div>
    </div>
  );
}

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { address } = useWallet();

  const [contractId, setContractId] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [network, setNetwork]   = useState<"testnet" | "mainnet">("testnet");
  const [phase, setPhase]       = useState<ScanPhase>("idle");
  const [scanResult, setScanResult] = useState<ScanStatusResponse | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [copied, setCopied]     = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkApiHealth().then(setApiOnline);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Validate on blur / change (only after first submit attempt)
  const [submitted, setSubmitted] = useState(false);
  const handleIdChange = (v: string) => {
    setContractId(v);
    if (submitted) setValidationError(validateContractId(v));
  };

  const handleScan = useCallback(async () => {
    setSubmitted(true);
    const id = contractId.trim();
    const err = validateContractId(id);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    setPhase("scanning");
    setError(null);
    setScanResult(null);

    toast({
      variant: "info",
      message: "Brewing started...",
    });

    try {
      const { scanId } = await startScan(id, network);

      pollRef.current = setInterval(async () => {
        try {
          const status = await pollScan(scanId);
          setScanResult(status);

          if (status.status === "complete") {
            stopPolling();
            setPhase("complete");
            const score = status.result?.riskScore ?? 0;

            // Sync with LocalStorage reports
            try {
              const reportRes = await fetch(`/api/report/${id}/json`);
              if (reportRes.ok) {
                const rawReport = await reportRes.json();
                rawReport.contractId = id;
                await saveReport(`${id}.report.json`, rawReport, address);
              }
            } catch (saveErr) {
              console.error("Failed to save report locally:", saveErr);
            }

            toast({
              variant: "success",
              message: "Brew complete successfully.",
              action: {
                label: "View Report",
                onClick: () => router.push(`/report/${id}`),
              },
            });
          } else if (status.status === "error") {
            stopPolling();
            setPhase("error");
            const msg = status.error ?? "Brew failed";
            setError(msg);
            toast({ variant: "error", message: "Brew failed", description: msg });
          }
        } catch (pollErr) {
          stopPolling();
          setPhase("error");
          const msg = pollErr instanceof Error ? pollErr.message : "Polling failed";
          setError(msg);
          toast({ variant: "error", message: "Brew failed", description: msg });
        }
      }, 2000);
    } catch (startErr) {
      setPhase("error");
      const msg = startErr instanceof Error ? startErr.message : "Failed to start brew";
      setError(msg);
      toast({ variant: "error", message: "Brew failed", description: msg });
    }
  }, [contractId, network, stopPolling, toast, address, router]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const reset = () => {
    stopPolling();
    setPhase("idle");
    setScanResult(null);
    setError(null);
    setSubmitted(false);
    setValidationError(null);
    setContractId("");
  };

  const result = scanResult?.result;
  const scanProgress = scanResult?.progress ?? (phase === "scanning" ? 10 : 0);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(contractId.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-label text-muted-foreground">Security</p>
          <h1 className="mt-1 text-h2 text-foreground">Brew Contract</h1>
          <p className="mt-2 text-body text-text-secondary">
            Enter a Soroban contract ID to run a full security analysis.
          </p>
        </motion.div>

        {/* API status banner */}
        <AnimatePresence>
          {apiOnline === false && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3"
            >
              <WifiOff size={15} className="shrink-0 text-warning" />
              <p className="text-sm text-warning">
                Sentinel API is offline. Start it with{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">npm run serve</code>{" "}
                in the sentinel directory.
              </p>
            </motion.div>
          )}
          {apiOnline === true && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-5 flex items-center gap-2 text-sm text-success"
            >
              <Wifi size={13} />
              <span>API server connected</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">

          {/* Left column: form + results */}
          <div className="space-y-4">

            {/* Input card */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-5">

                  {/* Contract ID */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Contract ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={contractId}
                        onChange={(e) => handleIdChange(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && phase === "idle" && void handleScan()}
                        placeholder="C… (56-character Stellar contract address)"
                        disabled={phase === "scanning"}
                        aria-invalid={!!validationError}
                        className={`w-full rounded-md border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 ${
                          validationError ? "border-critical/60" : "border-border"
                        }`}
                      />
                      {contractId.length === 56 && !validationError && (
                        <button
                          type="button"
                          onClick={() => void handleCopyId()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                          title="Copy"
                        >
                          {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {validationError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-1.5 flex items-center gap-1.5 text-xs text-critical"
                        >
                          <AlertCircle size={12} />
                          {validationError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Network selector */}
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

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {phase === "idle" || phase === "error" ? (
                      <Button
                        onClick={() => void handleScan()}
                        disabled={!contractId.trim() || apiOnline === false}
                        className="gap-2"
                      >
                        <Search size={14} />
                        Brew Contract
                      </Button>
                    ) : phase === "scanning" ? (
                      <Button disabled className="gap-2">
                        <Loader2 size={14} className="animate-spin" />
                        Brewing…
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={reset} className="gap-2">
                          Scan Another
                        </Button>
                        {result && (
                          <Button asChild className="gap-2">
                            <Link href={`/report/${contractId.trim()}`}>
                              <ExternalLink size={14} />
                              View Report
                            </Link>
                          </Button>
                        )}
                      </>
                    )}

                    <Button variant="ghost" size="default" asChild className="gap-2">
                      <Link href="/history">
                        <History size={14} />
                        History
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scanning card */}
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
                        <Loader2 size={17} className="animate-spin text-primary" />
                        <span className="font-medium text-foreground">
                          {getBrewingStatus(scanProgress, phase)}
                        </span>
                        <span className="ml-auto font-mono text-sm text-muted-foreground">
                          {scanProgress}%
                        </span>
                      </div>

                      <ScanAnimation progress={scanProgress} phase={phase} />

                      <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          animate={{ width: `${scanProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Extracting WASM → Parsing Call Graph → Running Detectors → Pouring Roast
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Error card */}
              {phase === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="border-critical/30">
                    <CardContent className="flex items-start gap-3 p-6">
                      <AlertCircle size={17} className="mt-0.5 shrink-0 text-critical" />
                      <div>
                        <p className="font-medium text-foreground">Scan Failed</p>
                        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Results card */}
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
                      <div className="mb-5 flex items-center gap-3">
                        {result.critical > 0
                          ? <ShieldX    size={20} className="text-critical" />
                          : result.high > 0
                            ? <ShieldAlert size={20} className="text-warning" />
                            : <ShieldCheck size={20} className="text-success" />
                        }
                        <span className="font-semibold text-foreground">Brew Complete</span>
                        <div className="ml-auto">
                          <BrewRoastBadge score={result.riskScore} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <FindingRow label="Critical" count={result.critical} color="text-critical" />
                        <FindingRow label="High"     count={result.high}     color="text-critical" />
                        <FindingRow label="Medium"   count={result.medium}   color="text-warning" />
                        <FindingRow label="Low"      count={result.low}      color="text-muted-foreground" />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button asChild className="gap-2">
                          <Link href={`/report/${contractId.trim()}`}>
                            <ExternalLink size={14} />
                            Full Report
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={async () => {
                            try {
                              const { fetchRawReport } = await import("@/services/scanApi");
                              const report = await fetchRawReport(contractId.trim());
                              const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                              const url  = URL.createObjectURL(blob);
                              const a    = document.createElement("a");
                              a.href     = url;
                              a.download = `${contractId.trim()}.json`;
                              a.click();
                              URL.revokeObjectURL(url);
                            } catch {
                              toast({ variant: "error", message: "Download failed" });
                            }
                          }}
                        >
                          <Download size={14} />
                          Download JSON
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right column: tips */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <Card>
              <CardContent className="p-5">
                <p className="text-label text-muted-foreground">How it works</p>
                <ol className="mt-3 space-y-3 text-small text-text-secondary">
                  {[
                    "Fetches the contract WASM from Stellar RPC.",
                    "Parses WASM instructions and call graph.",
                    "Runs 15 security detectors.",
                    "Scores risk using severity weights.",
                    "Saves report to the shared reports directory.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-bold text-muted-foreground">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-label text-muted-foreground">Where to find a contract ID</p>
                <p className="mt-2 text-small text-text-secondary">
                  Contract IDs are 56-character addresses starting with{" "}
                  <code className="font-mono text-primary">C</code>. Find them on{" "}
                  <a
                    href="https://stellar.expert"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    stellar.expert
                  </a>{" "}
                  or in your deployment output.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-label text-muted-foreground">CLI alternative</p>
                <code className="mt-2 block rounded-md border border-border bg-muted/50 p-3 font-mono text-xs text-foreground">
                  npx sentinel scan &lt;CONTRACT_ID&gt;
                </code>
                <p className="mt-2 text-xs text-muted-foreground">
                  CLI scans automatically appear in History.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
