"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Wallet,
  Settings,
  ShieldCheck,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-72 border-r border-zinc-800 bg-black text-emerald-100 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-emerald-500" size={26} />
          <div>
            <h1 className="text-xl font-bold tracking-wide">
              Sentinel
            </h1>
            <p className="text-xs text-zinc-400">
              Soroban Security Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-900 transition"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link
          href="/reports"
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-900 transition"
        >
          <FileText size={18} />
          Reports
        </Link>

        <Link
          href="/wallet"
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-900 transition"
        >
          <Wallet size={18} />
          Wallet
        </Link>

        <button
          disabled
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-zinc-500 cursor-not-allowed"
        >
          <Settings size={18} />
          Settings
        </button>
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-5 space-y-4">
        <div>
          <p className="text-xs text-zinc-500 uppercase">
            Wallet Status
          </p>
          <p className="text-sm font-medium text-emerald-400">
            Not Connected
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500 uppercase">
            Health Score
          </p>
          <p className="text-lg font-bold">
            --
          </p>
        </div>
      </div>
    </aside>
  );
}