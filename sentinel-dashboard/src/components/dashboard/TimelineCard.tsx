"use client";

import { motion } from "framer-motion";
import {
  Clock3,
  Activity,
} from "lucide-react";

interface TimelineEvent {
  title: string;
  time: string;
}

interface TimelineCardProps {
  events?: TimelineEvent[];
}

export default function TimelineCard({
  events = [],
}: TimelineCardProps) {
  const hasEvents = events.length > 0;

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
            Activity Timeline
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Recent validation activity
          </p>
        </div>

        <div className="rounded-xl bg-emerald-500/10 p-3">
          <Clock3
            size={26}
            className="text-emerald-400"
          />
        </div>

      </div>

      <div className="mt-8">

        {hasEvents ? (
          <div className="space-y-5">

            {events.map((event, index) => (
              <div
                key={index}
                className="flex gap-4"
              >
                <div className="mt-1 h-3 w-3 rounded-full bg-emerald-400" />

                <div>
                  <p className="font-medium text-white">
                    {event.title}
                  </p>

                  <p className="text-sm text-zinc-500">
                    {event.time}
                  </p>
                </div>
              </div>
            ))}

          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">

              <Activity
                size={18}
                className="text-emerald-400"
              />

              <span className="font-medium text-emerald-300">
                No Activity Yet
              </span>

            </div>

            <p className="mt-5 leading-7 text-zinc-400">
              Your validation history, imported reports,
              and wallet activity will appear here after
              your first Sentinel scan.
            </p>
          </>
        )}

      </div>
    </motion.div>
  );
}