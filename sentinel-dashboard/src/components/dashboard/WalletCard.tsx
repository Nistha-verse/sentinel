"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  CircleCheckBig,
  CircleOff,
} from "lucide-react";

interface WalletCardProps {
  connected?: boolean;
  address?: string;
  network?: string;
}

export default function WalletCard({
  connected = false,
  address,
  network,
}: WalletCardProps) {
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
            Wallet
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Freighter Integration
          </p>
        </div>

        <div className="rounded-xl bg-emerald-500/10 p-3">
          <Wallet
            size={26}
            className="text-emerald-400"
          />
        </div>

      </div>

      {/* Body */}

      <div className="mt-8">

        {connected ? (
          <>
            <div className="flex items-center gap-2">

              <CircleCheckBig
                size={18}
                className="text-green-500"
              />

              <span className="font-medium text-green-400">
                Connected
              </span>

            </div>

            <div className="mt-5 space-y-2">

              <p className="text-sm text-zinc-500">
                Public Address
              </p>

              <div className="rounded-lg bg-zinc-800 px-3 py-2 font-mono text-sm text-zinc-200 break-all">
                {address}
              </div>

              <p className="pt-3 text-sm text-zinc-500">
                Network
              </p>

              <div className="inline-flex rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400">
                {network}
              </div>

            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">

              <CircleOff
                size={18}
                className="text-zinc-500"
              />

              <span className="font-medium text-zinc-300">
                Wallet Not Connected
              </span>

            </div>

            <p className="mt-5 leading-7 text-zinc-400">
              Connect your Freighter wallet to verify
              your Stellar identity and access deployed
              Soroban smart contracts.
            </p>

            <button
              className="mt-6 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-600"
            >
              Connect Freighter
            </button>
          </>
        )}

      </div>
    </motion.div>
  );
}