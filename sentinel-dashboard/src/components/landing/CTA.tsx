"use client";
import Link from "next/link";

import { motion } from "framer-motion";
import { Wallet, TerminalSquare } from "lucide-react";

export default function CTA() {
  return (
    <section className="bg-[#0B0F0D] px-6 py-32">
      <div className="mx-auto max-w-6xl">

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-zinc-900 to-zinc-950 p-12 text-center shadow-[0_0_60px_rgba(16,185,129,0.08)]"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
            GET STARTED
          </p>

          <h2 className="mt-5 text-5xl font-black leading-tight text-white">
            Ready to secure your
            <span className="text-emerald-400"> Soroban project?</span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            Connect your Freighter wallet to explore deployed contracts or
            import a Sentinel CLI report to begin monitoring your project's
            security.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
<Link href="/wallet">
              <button className="flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4 text-lg font-semibold text-white transition hover:bg-emerald-600">
                <Wallet size={22} />
                Connect Freighter
              </button>
            </Link>
            <Link href="/reports">
              <button className="flex items-center gap-2 rounded-xl border border-zinc-700 px-8 py-4 text-lg font-semibold text-zinc-200 transition hover:border-emerald-400 hover:text-emerald-400">
                <TerminalSquare size={22} />
                Import  CLI Report
              </button>
            </Link>

          </div>

          <div className="mt-12 border-t border-zinc-800 pt-10">

            <p className="text-base font-medium tracking-wide text-zinc-400">
              Validate before you deploy.
            </p>

            <p className="mt-10 text-center text-4xl font-black tracking-[0.5em] text-emerald-500/20">
              SENTINEL
            </p>

          </div>

        </motion.div>

      </div>
    </section>
  );
}