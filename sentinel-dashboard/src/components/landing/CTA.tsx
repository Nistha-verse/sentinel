"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TerminalSquare, ArrowRight } from "lucide-react";

import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";

export default function CTA() {
  const { connected } = useWallet();

  return (
    <section className="border-t border-border bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-lg border border-border bg-card"
        >
          <div className="pattern-grid pointer-events-none absolute inset-0 opacity-20" />

          <div className="relative grid gap-10 p-8 lg:grid-cols-2 lg:items-center lg:p-12">
            <div>
              <p className="text-label text-primary">Get started</p>
              <h2 className="mt-3 text-h2 text-foreground">
                Ready to secure your
                <span className="text-primary"> Soroban project?</span>
              </h2>
              <p className="mt-4 text-body text-text-secondary">
                One click opens Freighter. After approval, you&apos;ll land on
                your dashboard with automatic project discovery — no detours.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              {connected ? (
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/dashboard">Open Dashboard</Link>
                </Button>
              ) : (
                <ConnectWalletButton
                  redirectTo="/dashboard"
                  size="lg"
                  label="Connect Wallet"
                  className="w-full sm:w-auto"
                />
              )}

              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link href="/reports">
                  <TerminalSquare size={16} />
                  Import CLI Report
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative border-t border-border px-8 py-6 lg:px-12">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <p className="text-small font-medium text-text-secondary">
                Validate before you deploy.
              </p>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-primary transition hover:text-primary/80"
              >
                Go to dashboard
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </motion.div>

        <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-label text-muted-foreground">Sentinel</p>
          <p className="text-xs text-muted-foreground">
            Soroban smart contract security for Stellar
          </p>
        </footer>
      </div>
    </section>
  );
}
