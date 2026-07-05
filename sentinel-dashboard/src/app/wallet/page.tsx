"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react";

import AppLayout from "@/components/layout/Applayout";
import { useWallet } from "@/context/WalletContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import WalletConnectionStatus from "@/components/wallet/WalletConnectionStatus";
import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import { isSupportedNetwork } from "@/components/wallet/wallet-states";

const FREIGHTER_URL = "https://www.freighter.app/";

export default function WalletPage() {
  const { connected, address, network, loading, refreshWallet } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const networkOk = isSupportedNetwork(network);

  return (
    <AppLayout>
      <div className="p-4 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-label text-muted-foreground">Profile</p>
          <h1 className="mt-1 text-h2 text-foreground">Wallet Management</h1>
          <p className="mt-2 max-w-2xl text-body text-text-secondary">
            View your Freighter connection, network configuration, and identity
            details. Connection is initiated from the landing page or navbar —
            not here.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-5">
          {/* Identity card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Card className="relative overflow-hidden">
              <div className="h-1 w-full bg-primary" />

              <CardContent className="p-0">
                <div className="pattern-grid border-b border-border p-6 opacity-30">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-md border border-border bg-card">
                        <Wallet size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-label text-muted-foreground">
                          Freighter
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          Stellar Identity Card
                        </p>
                      </div>
                    </div>
                    <WalletConnectionStatus />
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-10 animate-pulse rounded-md bg-muted" />
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  ) : connected ? (
                    <>
                      <div>
                        <p className="text-label text-muted-foreground">
                          Public address
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <p className="flex-1 break-all font-mono text-sm text-foreground">
                            {address}
                          </p>
                          <button
                            type="button"
                            onClick={handleCopy}
                            className="shrink-0 rounded-md border border-border p-2 text-muted-foreground transition hover:bg-hover hover:text-foreground"
                            aria-label="Copy address"
                          >
                            {copied ? (
                              <Check size={14} className="text-success" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-label text-muted-foreground">
                            Network
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <p className="text-sm font-medium text-primary">
                              {network}
                            </p>
                            <Badge variant={networkOk ? "success" : "warning"}>
                              {networkOk ? "Supported" : "Unsupported"}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-label text-muted-foreground">
                            Protocol
                          </p>
                          <p className="mt-1.5 text-sm font-medium text-foreground">
                            Soroban
                          </p>
                        </div>
                      </div>

                      <Progress
                        value={networkOk ? 100 : 40}
                        label="Connection health"
                        barClassName={networkOk ? "bg-success" : "bg-warning"}
                      />
                    </>
                  ) : (
                    <div className="space-y-4">
                      <WalletConnectionStatus layout="card" />

                      <p className="text-small text-text-secondary">
                        Your wallet is not connected. Use the button below or
                        connect from the landing page — Freighter will open
                        immediately without leaving this app.
                      </p>

                      <ConnectWalletButton
                        redirectTo="/dashboard"
                        label="Connect Wallet"
                      />
                    </div>
                  )}
                </div>

                {connected && !loading && (
                  <div className="flex flex-col gap-2 border-t border-border p-6 sm:flex-row">
                    <Button variant="outline" className="flex-1" asChild>
                      <a
                        href={FREIGHTER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={14} />
                        Manage in Freighter
                      </a>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link href="/dashboard">
                        <LayoutDashboard size={14} />
                        Go to Dashboard
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Side panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4 lg:col-span-2"
          >
            <Card>
              <CardContent className="p-5">
                <p className="text-label text-muted-foreground">Permissions</p>
                <ul className="mt-3 space-y-2 text-small text-text-secondary">
                  <li>· Read public key only</li>
                  <li>· No transaction signing from Sentinel</li>
                  <li>· Keys never leave Freighter</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-label text-muted-foreground">Actions</p>
                <div className="mt-3 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => refreshWallet()}
                  >
                    Refresh connection
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Re-syncs wallet state from Freighter without reconnecting.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="p-5">
                <p className="text-label text-muted-foreground">
                  Connection states
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    "not_installed",
                    "connecting",
                    "denied",
                    "connected",
                    "wrong_network",
                  ].map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">
                      {s.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Sentinel surfaces each state clearly during the connection flow.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
