"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Wallet,
  ShieldCheck,
  ScanSearch,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

import { useWallet } from "@/context/WalletContext";
import { useReportData } from "@/components/dashboard/useReportData";
import WalletConnectionStatus from "@/components/wallet/WalletConnectionStatus";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Scan", icon: ScanSearch },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { connected, address, network } = useWallet();
  const { metrics, hasReport } = useReportData();

  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "--";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 ease-out lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-5">
        <Link href="/" className="flex items-center gap-3" onClick={onClose}>
          <motion.div
            whileHover={{ scale: 1.04 }}
            className="flex size-8 items-center justify-center rounded-md border border-border bg-muted"
          >
            <ShieldCheck className="size-4 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-foreground">
              Sentinel
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Soroban Security
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-muted-foreground transition hover:bg-hover hover:text-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <p className="mb-2 px-3 text-label text-muted-foreground">Menu</p>

        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-hover text-primary"
                  : "text-text-secondary hover:bg-hover hover:text-foreground"
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {label}
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="ml-auto size-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4 border-t border-border p-4">
        <div className="rounded-md border border-border bg-muted/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-label text-muted-foreground">Wallet</p>
            <WalletConnectionStatus />
          </div>

          {connected ? (
            <div className="space-y-0.5">
              <p className="font-mono text-xs text-text-secondary">
                {shortAddress}
              </p>
              <p className="text-xs text-muted-foreground">{network}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Connect from the landing page or navbar
            </p>
          )}
        </div>

        <div className="px-1">
          <p className="text-label text-muted-foreground">Coverage</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {hasReport && metrics && metrics.coveragePercent !== null
              ? `${metrics.coveragePercent}%`
              : hasReport
                ? "—"
                : "--"}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasReport && metrics ? metrics.contractName : "Awaiting CLI scan"}
          </p>
        </div>
      </div>
    </aside>
  );
}
