"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";

import ScanAnimation from "./ScanAnimation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import WalletConnectionStatus from "@/components/wallet/WalletConnectionStatus";
import { useWallet } from "@/context/WalletContext";

export default function Hero() {
  const { connected, loading } = useWallet();

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <div className="pattern-grid pointer-events-none absolute inset-0 opacity-30" />
      <div
        className="pointer-events-none absolute -right-32 top-20 size-64 rounded-full border border-border/50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-32 h-48 w-px bg-border/60"
        aria-hidden
      />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-8">
        <div className="max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-6">
              <Shield size={12} className="mr-1.5" />
              Stellar · Soroban · Security
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <ScanAnimation />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-6 text-body text-text-secondary"
          >
            Smart contract security platform for the{" "}
            <span className="font-medium text-foreground">Stellar ecosystem</span>
            . Validate deployments, monitor coverage, and catch vulnerabilities
            before they reach production.
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-8 text-h1 text-foreground"
          >
            Validate.
            <span className="text-primary"> Monitor.</span>
            <br />
            Protect.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-10 flex flex-wrap items-center gap-3"
          >
            {loading ? (
              <Button disabled size="lg">
                Checking wallet…
              </Button>
            ) : connected ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Open Dashboard
                  <ArrowRight size={16} />
                </Link>
              </Button>
            ) : (
              <ConnectWalletButton
                redirectTo="/dashboard"
                size="lg"
                label="Connect Wallet"
              />
            )}

            <Button variant="outline" size="lg" asChild>
              <Link href="/reports">View Reports</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4"
          >
            <WalletConnectionStatus />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="relative lg:mt-12"
        >
          <div className="rounded-lg border border-border bg-card p-6 lg:p-8">
            <p className="text-label text-muted-foreground">At a glance</p>

            <div className="mt-6 space-y-5">
              {[
                { label: "Contract validation", value: "Soroban-native" },
                { label: "Wallet identity", value: "Freighter" },
                { label: "Report source", value: "Sentinel CLI" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="flex items-baseline justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                >
                  <span className="text-small text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {item.value}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 rounded-md border border-dashed border-border bg-muted/30 p-4">
              <p className="text-small text-text-secondary">
                Connect your wallet to trigger Freighter instantly — no page
                redirect. Projects are discovered automatically on the dashboard.
              </p>
            </div>
          </div>

          <div
            className="absolute -bottom-4 -left-4 -z-10 hidden h-full w-full rounded-lg border border-border/40 lg:block"
            aria-hidden
          />
        </motion.div>
      </div>
    </section>
  );
}
