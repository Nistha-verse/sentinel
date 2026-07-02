"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Wallet,
  TerminalSquare,
  FileSearch,
  BarChart3,
  Layers3,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Contract Validation",
    description:
      "Analyze Soroban smart contracts for configuration issues before deployment.",
  },
  {
    icon: Wallet,
    title: "Freighter Integration",
    description:
      "Use your Stellar wallet as your identity and securely access deployed contracts.",
  },
  {
    icon: TerminalSquare,
    title: "CLI Powered",
    description:
      "Import validation reports directly from the Sentinel CLI with zero manual parsing.",
  },
  {
    icon: FileSearch,
    title: "Actionable Reports",
    description:
      "Readable validation reports that developers can immediately act upon.",
  },
  {
    icon: BarChart3,
    title: "Project Health",
    description:
      "Monitor overall security posture from a single dashboard powered by real validation data.",
  },
  {
    icon: Layers3,
    title: "Built for Soroban",
    description:
      "Purpose-built for Stellar smart contract development instead of being a generic scanner.",
  },
];

export default function Features() {
  return (
    <section className="bg-[#0B0F0D] px-6 py-28">
      <div className="mx-auto max-w-7xl">

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-400">
            Features
          </p>

          <h2 className="mt-4 text-5xl font-bold text-white">
            Everything you need.
            <span className="text-emerald-400">
              {" "}Nothing you don't.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-zinc-400">
            Sentinel focuses on practical developer tooling instead of unnecessary complexity.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
                whileHover={{
                  y: -6,
                }}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 transition-all hover:border-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Icon
                    size={28}
                    className="text-emerald-400 transition-transform group-hover:scale-110"
                  />
                </div>

                <h3 className="text-2xl font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-zinc-400">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}