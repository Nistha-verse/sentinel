"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileCode2,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { useWallet } from "@/context/WalletContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { isSupportedNetwork } from "@/components/wallet/wallet-states";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { useContractDiscovery } from "@/components/dashboard/useContractDiscovery";

export default function ProjectDiscovery() {
  const { connected, address, network, loading } = useWallet();
  const { phase, progress, projects, error, retry, isDiscovering } =
    useContractDiscovery();

  if (!connected || loading) return null;

  const networkOk = isSupportedNetwork(network);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                <AnimatePresence mode="wait">
                  {phase === "scanning" ? (
                    <motion.div
                      key="scan"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader2 size={16} className="animate-spin text-primary" />
                    </motion.div>
                  ) : phase === "complete" ? (
                    <motion.div
                      key="done"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <CheckCircle2 size={16} className="text-success" />
                    </motion.div>
                  ) : phase === "error" ? (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <AlertCircle size={16} className="text-warning" />
                    </motion.div>
                  ) : (
                    <Search size={16} className="text-primary" />
                  )}
                </AnimatePresence>
              </div>

              <div>
                <p className="text-label text-muted-foreground">
                  Project discovery
                </p>
                <h3 className="mt-0.5 text-base font-semibold text-foreground">
                  {phase === "scanning"
                    ? "Discovering Soroban contracts…"
                    : phase === "complete"
                      ? projects.length > 0
                        ? `Found ${projects.length} contract${projects.length === 1 ? "" : "s"}`
                        : "Discovery complete"
                      : phase === "error"
                        ? "Discovery failed"
                        : "Ready to discover"}
                </h3>
                <p className="mt-1 font-mono text-xs text-text-secondary">
                  {address?.slice(0, 8)}…{address?.slice(-6)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {network && (
                <Badge variant={networkOk ? "success" : "warning"}>
                  {network}
                </Badge>
              )}
              {(phase === "complete" || phase === "error") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={retry}
                  disabled={isDiscovering}
                >
                  <RefreshCw
                    size={14}
                    className={isDiscovering ? "animate-spin" : undefined}
                  />
                  Rescan
                </Button>
              )}
            </div>
          </div>

          {(phase === "scanning" || phase === "complete") && (
            <div className="mt-5">
              <Progress
                value={progress}
                animated
                label={
                  phase === "scanning"
                    ? "Querying Horizon for Soroban operations"
                    : "Wallet scan"
                }
                barClassName={
                  phase === "complete" ? "bg-success" : undefined
                }
              />
            </div>
          )}

          <AnimatePresence>
            {phase === "error" && error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/5 p-4">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0 text-warning"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Unable to discover contracts
                    </p>
                    <p className="mt-1 text-small text-text-secondary">
                      {error}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "complete" && projects.length === 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 overflow-hidden"
              >
                <div className="flex items-start gap-3 rounded-md border border-dashed border-border bg-muted/30 p-4">
                  <FileCode2
                    size={16}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      No contracts discovered yet.
                    </p>
                    <p className="mt-1 text-small text-text-secondary">
                      Deploy or invoke a Soroban contract from this wallet, or
                      import a Sentinel CLI report to analyze local projects.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {phase === "complete" && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.contractId}
              project={project}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
