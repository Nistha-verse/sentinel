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

import { Card, CardContent } from "@/components/ui/card";

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
    <section className="border-t border-border bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl"
        >
          <p className="text-label text-primary">Features</p>
          <h2 className="mt-3 text-h2 text-foreground">
            Everything you need.
            <span className="text-text-secondary"> Nothing you don&apos;t.</span>
          </h2>
          <p className="mt-4 text-body text-text-secondary">
            Sentinel focuses on practical developer tooling instead of unnecessary
            complexity.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06, duration: 0.35 }}
              >
                <Card className="h-full transition-colors hover:border-primary/25 hover:bg-hover">
                  <CardContent className="p-5">
                    <div className="mb-4 flex size-9 items-center justify-center rounded-md border border-border bg-muted">
                      <Icon size={16} className="text-primary" />
                    </div>

                    <h3 className="text-base font-semibold text-foreground">
                      {feature.title}
                    </h3>

                    <p className="mt-2 text-small leading-relaxed text-text-secondary">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
