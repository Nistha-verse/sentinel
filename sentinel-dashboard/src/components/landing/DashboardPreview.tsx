"use client";

import { motion } from "framer-motion";

import HealthCard from "@/components/dashboard/HealthCard";
import WalletCard from "@/components/dashboard/WalletCard";
import ReportsCard from "@/components/dashboard/ReportsCard";
import TimelineCard from "@/components/dashboard/TimelineCard";

export default function DashboardPreview() {
  return (
    <section className="bg-[#0B0F0D] px-6 py-28">
      <div className="mx-auto max-w-7xl">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
            Dashboard Preview
          </p>

          <h2 className="mt-4 text-5xl font-bold text-white">
            Your security workspace.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            Sentinel never invents data.
            Your dashboard comes alive only after connecting
            Freighter or importing a Sentinel CLI report.
          </p>
        </motion.div>

        {/* Dashboard */}

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-20 rounded-3xl border border-zinc-800 bg-zinc-950/60 p-8 backdrop-blur-xl"
        >
          {/* Fake Navbar */}

          <div className="mb-10 flex items-center justify-between border-b border-zinc-800 pb-6">

            <div>
              <h3 className="text-2xl font-bold text-white">
                Sentinel Dashboard
              </h3>

              <p className="mt-1 text-zinc-500">
                Waiting for your first validation...
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-400">
              Ready
            </div>

          </div>

          {/* Grid */}

          <div className="grid gap-6 lg:grid-cols-2">

            <HealthCard />

            <WalletCard />

            <ReportsCard />

            <TimelineCard />

          </div>
        </motion.div>
      </div>
    </section>
  );
}