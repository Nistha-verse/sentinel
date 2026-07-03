"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ScanAnimation from "./ScanAnimation";
import {
  connectWallet,
  isWalletAuthorized,
} from "@/services/freighter";

export default function Hero() {
  const [checkingWallet, setCheckingWallet] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const checkWallet = async () => {
      try {
        const authorized = await isWalletAuthorized();
        setWalletConnected(authorized);
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingWallet(false);
      }
    };

    checkWallet();
  }, []);

  const handleConnect = async () => {
    try {
      setConnecting(true);

      await connectWallet();

      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0B0F0D] px-6 text-center">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_65%)]" />

      <div className="relative z-10 max-w-5xl">
        <ScanAnimation />

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="mt-8 text-xl text-zinc-300"
        >
          Smart Contract Security Platform for the
          <span className="font-semibold text-emerald-400">
            {" "}
            Stellar Ecosystem
          </span>
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.6 }}
          className="mx-auto mt-6 max-w-4xl text-5xl font-bold leading-tight text-white"
        >
          Validate.
          <span className="text-emerald-400"> Monitor.</span>
          Protect.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.6 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400"
        >
          Detect vulnerabilities, analyze Soroban smart contracts,
          monitor deployments, and generate detailed security reports —
          all from one dashboard.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.6 }}
          className="mt-12 flex flex-wrap justify-center gap-5"
        >
          {checkingWallet ? (
            <button
              disabled
              className="rounded-xl bg-zinc-700 px-8 py-4 text-lg font-semibold text-white"
            >
              Checking Wallet...
            </button>
          ) : walletConnected ? (
            <Link
              href="/dashboard"
              className="rounded-xl bg-emerald-500 px-8 py-4 text-lg font-semibold text-white transition hover:bg-emerald-600"
            >
              Open Dashboard →
            </Link>
          ) : (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="rounded-xl bg-emerald-500 px-8 py-4 text-lg font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {connecting
                ? "Connecting..."
                : "Connect Freighter"}
            </button>
          )}

          <Link
            href="/reports"
            className="rounded-xl border border-zinc-700 px-8 py-4 text-lg font-semibold text-zinc-200 transition hover:border-emerald-400 hover:text-emerald-400"
          >
            View Reports
          </Link>
        </motion.div>
      </div>
    </section>
  );
}