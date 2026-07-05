"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";

import HealthCard from "@/components/dashboard/HealthCard";
import WalletCard from "@/components/dashboard/WalletCard";
import ReportsCard from "@/components/dashboard/ReportsCard";
import TimelineCard from "@/components/dashboard/TimelineCard";
import { Badge } from "@/components/ui/badge";

export default function DashboardPreview() {
  return (
    <section className="border-t border-border bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-xl"
          >
            <p className="text-label text-primary">Dashboard Preview</p>
            <h2 className="mt-3 text-h2 text-foreground">
              Your security workspace.
            </h2>
            <p className="mt-4 text-body text-text-secondary">
              Sentinel never invents data. Your dashboard comes alive only after
              connecting Freighter or importing a Sentinel CLI report.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary">
              <Activity size={12} className="mr-1.5" />
              Live preview
            </Badge>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative mt-14"
        >
          {/* Browser chrome */}
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-2xl shadow-black/20">
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
              </div>
              <div className="mx-auto rounded-md bg-background px-4 py-1">
                <span className="font-mono text-xs text-muted-foreground">
                  sentinel.app/dashboard
                </span>
              </div>
            </div>

            <div className="p-6 lg:p-8">
              <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Monitoring Console
                  </h3>
                  <p className="mt-0.5 text-small text-muted-foreground">
                    Waiting for your first validation…
                  </p>
                </div>
                <Badge variant="outline">Ready</Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <HealthCard />
                <WalletCard />
                <ReportsCard />
                <TimelineCard />
              </div>
            </div>
          </div>

          <div
            className="absolute -right-3 -top-3 -z-10 hidden h-full w-full rounded-lg border border-primary/10 lg:block"
            aria-hidden
          />
        </motion.div>
      </div>
    </section>
  );
}
