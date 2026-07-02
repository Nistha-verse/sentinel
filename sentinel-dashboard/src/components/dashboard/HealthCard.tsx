"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Activity,
} from "lucide-react";

interface HealthCardProps {
  score?: number;
  status?: string;
  loading?: boolean;
}

export default function HealthCard({
  score,
  status,
  loading = false,
}: HealthCardProps) {
  const hasData = score !== undefined && status !== undefined;

  return (
    <motion.div
      whileHover={{
        y: -6,
        transition: { duration: 0.2 },
      }}
      className="rounded-2xl border border-emerald-500/15 bg-zinc-900/70 p-6 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between">

        <div>
          <h3 className="text-lg font-semibold text-white">
            Project Health
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Overall security status
          </p>
        </div>

        <div className="rounded-xl bg-emerald-500/10 p-3">
          <ShieldCheck
            size={26}
            className="text-emerald-400"
          />
        </div>

      </div>

      {/* Body */}

      <div className="mt-8">

        {loading ? (
          <div className="space-y-3">

            <div className="h-10 w-32 animate-pulse rounded bg-zinc-800" />

            <div className="h-5 w-48 animate-pulse rounded bg-zinc-800" />

          </div>
        ) : hasData ? (
          <>
            <div className="flex items-end gap-2">

              <span className="text-5xl font-black text-emerald-400">
                {score}
              </span>

              <span className="mb-2 text-xl text-emerald-300">
                %
              </span>

            </div>

            <div className="mt-5 flex items-center gap-2">

              <Activity
                size={18}
                className="text-emerald-400"
              />

              <span className="font-medium text-white">
                {status}
              </span>

            </div>

          </>
        ) : (
          <>
            <div className="flex items-center gap-3">

              <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />

              <span className="font-medium text-emerald-300">
                Waiting for Validation
              </span>

            </div>

            <p className="mt-5 leading-7 text-zinc-400">
              Run a Sentinel CLI scan to generate your
              first project health score.
            </p>

          </>
        )}

      </div>
    </motion.div>
  );
}