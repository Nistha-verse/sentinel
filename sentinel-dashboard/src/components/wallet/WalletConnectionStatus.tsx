"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CircleCheckBig,
  CircleOff,
  Download,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useWallet } from "@/context/WalletContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  type WalletConnectionState,
  detectWalletConnectionState,
  CONNECTION_STATE_LABELS,
  isSupportedNetwork,
} from "./wallet-states";

const STATE_VARIANT: Record<
  WalletConnectionState,
  "success" | "warning" | "critical" | "secondary" | "info" | "default"
> = {
  idle: "secondary",
  checking: "secondary",
  not_installed: "warning",
  connecting: "info",
  denied: "critical",
  wrong_network: "warning",
  connected: "success",
  disconnected: "secondary",
};

const STATE_ICON: Record<WalletConnectionState, ReactNode> = {
  idle: <CircleOff size={12} />,
  checking: <Loader2 size={12} className="animate-spin" />,
  not_installed: <Download size={12} />,
  connecting: <Loader2 size={12} className="animate-spin" />,
  denied: <ShieldAlert size={12} />,
  wrong_network: <AlertTriangle size={12} />,
  connected: <CircleCheckBig size={12} />,
  disconnected: <CircleOff size={12} />,
};

interface WalletConnectionStatusProps {
  className?: string;
  showDescription?: boolean;
  layout?: "inline" | "card";
}

export default function WalletConnectionStatus({
  className,
  showDescription = true,
  layout = "inline",
}: WalletConnectionStatusProps) {
  const { connected, network, loading } = useWallet();
  const [state, setState] = useState<WalletConnectionState>("checking");

  useEffect(() => {
    if (loading) {
      setState("checking");
      return;
    }

    detectWalletConnectionState().then((detected) => {
      if (connected && network && !isSupportedNetwork(network)) {
        setState("wrong_network");
      } else {
        setState(detected);
      }
    });
  }, [connected, network, loading]);

  const meta = CONNECTION_STATE_LABELS[state];
  const variant = STATE_VARIANT[state];

  if (layout === "card") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "rounded-md border border-border bg-muted/40 p-4",
            className
          )}
        >
          <div className="flex items-center gap-3">
            <Badge variant={variant} className="shrink-0">
              {STATE_ICON[state]}
              <span className="ml-1">{meta.label}</span>
            </Badge>
            {showDescription && (
              <p className="text-small text-text-secondary">{meta.description}</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <Badge variant={variant} className={className}>
      {STATE_ICON[state]}
      <span className="ml-1">{meta.label}</span>
    </Badge>
  );
}
