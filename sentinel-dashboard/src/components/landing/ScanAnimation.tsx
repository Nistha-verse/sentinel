"use client";

import { motion } from "framer-motion";

export default function ScanAnimation() {
  return (
    <div className="relative flex items-center justify-center overflow-hidden py-12">
      {/* Glow behind logo */}
      <motion.div
        className="absolute h-44 w-44 rounded-full bg-emerald-500/20 blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 1.2,
        }}
      />

      {/* Logo Text */}
      <motion.h1
        initial={{
          opacity: 0,
          scale: 0.92,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 0.8,
          ease: "easeOut",
        }}
        className="relative text-7xl font-black tracking-[0.25em] text-emerald-400 select-none"
      >
        SENTINEL
      </motion.h1>

      {/* Scanner Line */}
      <motion.div
        initial={{
          y: -70,
          opacity: 0,
        }}
        animate={{
          y: 70,
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 1.8,
          ease: "easeInOut",
        }}
        className="absolute h-[3px] w-[620px] bg-emerald-400 shadow-[0_0_25px_#34d399]"
      />

      {/* Soft Scanner Glow */}
      <motion.div
        initial={{
          y: -70,
          opacity: 0,
        }}
        animate={{
          y: 70,
          opacity: [0, 0.4, 0.4, 0],
        }}
        transition={{
          duration: 1.8,
          ease: "easeInOut",
        }}
        className="absolute h-10 w-[620px] bg-emerald-400/10 blur-xl"
      />
    </div>
  );
}