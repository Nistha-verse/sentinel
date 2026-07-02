"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  TerminalSquare,
  ShieldCheck,
  ArrowDown,
} from "lucide-react";

const steps = [
  {
    icon: Wallet,
    title: "Connect Freighter",
    description:
      "Securely verify your Stellar identity and access your deployed Soroban contracts.",
  },
  {
    icon: TerminalSquare,
    title: "Import Sentinel CLI",
    description:
      "Load your real validation report generated from your local development environment.",
  },
  {
    icon: ShieldCheck,
    title: "Monitor Security",
    description:
      "Track project health, reports, contract validation and security insights from one dashboard.",
  },
];

export default function Workflow() {
  return (
    <section className="relative bg-[#0B0F0D] py-28 px-6">
      <div className="mx-auto max-w-6xl">

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-400">
            Workflow
          </p>

          <h2 className="mt-4 text-5xl font-bold text-white">
            Three simple steps.
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            Sentinel integrates directly into your Stellar development workflow.
            No fake dashboards. No synthetic reports. Only your real projects.
          </p>
        </motion.div>

        <div className="mt-20 flex flex-col items-center">

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="flex flex-col items-center">

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className="group w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 transition hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                >
                  <div className="flex items-start gap-6">

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Icon
                        className="text-emerald-400 transition group-hover:scale-110"
                        size={32}
                      />
                    </div>

                    <div>
                      <h3 className="text-2xl font-semibold text-white">
                        {step.title}
                      </h3>

                      <p className="mt-3 leading-7 text-zinc-400">
                        {step.description}
                      </p>
                    </div>

                  </div>
                </motion.div>

                {index !== steps.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="my-6 flex flex-col items-center"
                  >
                    <div className="h-12 w-[2px] bg-gradient-to-b from-emerald-500 to-transparent" />
                    <ArrowDown className="text-emerald-500" size={18} />
                  </motion.div>
                )}

              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}