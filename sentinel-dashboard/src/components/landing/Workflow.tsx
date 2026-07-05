"use client";

import { motion } from "framer-motion";
import { Wallet, TerminalSquare, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Wallet,
    step: "01",
    title: "Connect Freighter",
    description:
      "Securely verify your Stellar identity and access your deployed Soroban contracts.",
  },
  {
    icon: TerminalSquare,
    step: "02",
    title: "Import Sentinel CLI",
    description:
      "Load your real validation report generated from your local development environment.",
  },
  {
    icon: ShieldCheck,
    step: "03",
    title: "Monitor Security",
    description:
      "Track project health, reports, contract validation and security insights from one dashboard.",
  },
];

export default function Workflow() {
  return (
    <section className="relative border-t border-border bg-background py-24 lg:py-32">
      <div className="pattern-diagonal pointer-events-none absolute inset-0 opacity-20" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[0.4fr_0.6fr] lg:gap-20">
          {/* Left — sticky heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <p className="text-label text-primary">Workflow</p>
            <h2 className="mt-3 text-h2 text-foreground">
              Three steps to
              <br />
              full visibility.
            </h2>
            <p className="mt-4 max-w-sm text-body text-text-secondary">
              Sentinel integrates directly into your Stellar development workflow.
              No fake dashboards. No synthetic reports. Only your real projects.
            </p>
          </motion.div>

          {/* Right — staggered steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  style={{ marginLeft: index % 2 === 1 ? "2rem" : "0" }}
                >
                  <Card className="transition-colors hover:border-primary/30 hover:bg-hover">
                    <CardContent className="flex gap-5 p-5">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-label text-muted-foreground">
                          {step.step}
                        </span>
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                          <Icon size={18} className="text-primary" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 pt-1">
                        <h3 className="text-h3 text-foreground">{step.title}</h3>
                        <p className="mt-2 text-small leading-relaxed text-text-secondary">
                          {step.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
