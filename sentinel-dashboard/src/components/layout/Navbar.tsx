"use client";

import Link from "next/link";
import { Bell, Moon } from "lucide-react";

export default function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-black px-6">
      {/* Left */}
      <div>
        <h2 className="text-xl font-semibold text-emerald-100">
          Dashboard
        </h2>

        <p className="text-sm text-zinc-400">
          Monitor your Soroban project health
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        {/* Theme Toggle */}
        <button
          className="rounded-lg border border-zinc-700 p-2 transition hover:bg-zinc-900"
          aria-label="Toggle Theme"
        >
          <Moon size={18} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            className="rounded-lg border border-zinc-700 p-2 transition hover:bg-zinc-900"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </div>

        {/* Wallet */}
        <Link
          href="/wallet"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Connect Wallet
        </Link>

      </div>
    </header>
  );
}