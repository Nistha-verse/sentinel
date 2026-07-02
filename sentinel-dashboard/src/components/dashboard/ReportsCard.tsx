"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Clock3,
} from "lucide-react";

interface ReportsCardProps {
  hasReport?: boolean;
  reportName?: string;
  generatedAt?: string;
}

export default function ReportsCard({
  hasReport = false,
  reportName,
  generatedAt,
}: ReportsCardProps) {
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
            Validation Reports
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Latest CLI Output
          </p>
        </div>

        <div className="rounded-xl bg-emerald-500/10 p-3">
          <FileText
            size={26}
            className="text-emerald-400"
          />
        </div>
      </div>

      <div className="mt-8">

        {hasReport ? (
          <>
            <div className="rounded-xl bg-zinc-800 p-4">

              <p className="font-medium text-white">
                {reportName}
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                <Clock3 size={15} />
                {generatedAt}
              </div>

            </div>

            <button
              className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600"
            >
              <Download size={18} />
              Download Report
            </button>
          </>
        ) : (
          <>
            <p className="font-medium text-emerald-300">
              No Reports Available
            </p>

            <p className="mt-5 leading-7 text-zinc-400">
              Import your first Sentinel CLI report to
              view validation results and security findings.
            </p>

            <button
              className="mt-6 rounded-xl border border-emerald-500 px-5 py-3 font-semibold text-emerald-400 transition hover:bg-emerald-500 hover:text-white"
            >
              Import Report
            </button>
          </>
        )}

      </div>
    </motion.div>
  );
}