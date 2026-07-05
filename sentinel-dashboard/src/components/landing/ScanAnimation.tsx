"use client";

import { motion } from "framer-motion";

export default function ScanAnimation() {
  const letters = "SENTINEL".split("");

  return (
    <div className="relative flex items-center justify-center py-6">
      <div
        className="absolute -left-8 top-1/2 h-px w-24 -translate-y-1/2 bg-border"
        aria-hidden
      />
      <div
        className="absolute -right-8 top-1/2 h-px w-16 -translate-y-1/2 bg-border"
        aria-hidden
      />

      <div className="relative overflow-hidden">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-label mb-3 block text-primary"
        >
          Soroban Security
        </motion.span>

        <h1
          className="flex text-h1 font-semibold tracking-[0.12em] text-foreground"
          aria-label="Sentinel"
        >
          {letters.map((letter, i) => (
            <motion.span
              key={`${letter}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.08 * i,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block"
            >
              {letter}
            </motion.span>
          ))}
        </h1>

        {/* Scan sweep */}
        <motion.div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <motion.div
            className="absolute left-0 h-full w-8 bg-gradient-to-r from-transparent via-primary/20 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "400%" }}
            transition={{
              delay: 0.9,
              duration: 1.4,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
          className="mx-auto mt-4 h-px w-full max-w-xs origin-left bg-primary/70"
        />
      </div>
    </div>
  );
}
