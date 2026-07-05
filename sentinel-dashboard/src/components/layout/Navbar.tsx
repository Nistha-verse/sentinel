"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";

import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import WalletConnectionStatus from "@/components/wallet/WalletConnectionStatus";
import { isSupportedNetwork } from "@/components/wallet/wallet-states";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Monitor contract security across your deployments",
  },
  "/reports": {
    title: "Reports",
    subtitle: "Validation reports from Sentinel CLI",
  },
  "/wallet": {
    title: "Wallet",
    subtitle: "Connection profile and identity details",
  },
};

interface NavbarProps {
  onMenuClick?: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const { connected, address, network } = useWallet();

  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : null;

  const page = pageTitles[pathname] ?? {
    title: "Sentinel",
    subtitle: "Soroban security platform",
  };

  const networkOk = connected && isSupportedNetwork(network);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-2 text-muted-foreground transition hover:bg-hover hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {page.title}
          </h2>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {page.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {connected && network && (
          <Badge
            variant={networkOk ? "success" : "warning"}
            className="hidden sm:inline-flex"
          >
            <span
              className={`mr-1.5 size-1.5 rounded-full ${networkOk ? "bg-success" : "bg-warning"}`}
            />
            {network}
          </Badge>
        )}

        {!connected && (
          <div className="hidden md:block">
            <WalletConnectionStatus />
          </div>
        )}

        <button
          type="button"
          className="relative rounded-md border border-border p-2 text-muted-foreground transition hover:bg-hover hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-critical" />
        </button>

        {connected && shortAddress ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/wallet" className="font-mono text-xs">
              {shortAddress}
            </Link>
          </Button>
        ) : (
          <ConnectWalletButton
            redirectTo="/dashboard"
            size="sm"
            label="Connect"
            showLabel
            inline
          />
        )}
      </div>
    </header>
  );
}
