"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Wallet } from "lucide-react";

import { useWallet } from "@/context/WalletContext";
import {
  connectWallet as connectFreighter,
  getWalletInfo,
} from "@/services/freighter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type WalletConnectionState,
  detectWalletConnectionState,
  isSupportedNetwork,
  CONNECTION_STATE_LABELS,
} from "./wallet-states";

const FREIGHTER_INSTALL_URL =
  "https://www.freighter.app/";

interface ConnectWalletButtonProps {
  redirectTo?: string;
  onConnected?: () => void;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost";
  className?: string;
  showLabel?: boolean;
  label?: string;
  inline?: boolean;
}

export default function ConnectWalletButton({
  redirectTo = "/dashboard",
  onConnected,
  size = "lg",
  variant = "default",
  className,
  showLabel = true,
  label = "Connect Wallet",
  inline = false,
}: ConnectWalletButtonProps) {
  const router = useRouter();
  const { connected, refreshWallet } = useWallet();
  const [state, setState] = useState<WalletConnectionState>("checking");

  const refreshState = useCallback(async () => {
    const detected = await detectWalletConnectionState();
    setState(detected);
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState, connected]);

  const handleConnect = async () => {
    const current = await detectWalletConnectionState();

    if (current === "not_installed") {
      setState("not_installed");
      return;
    }

    if (current === "connected") {
      if (redirectTo) router.push(redirectTo);
      return;
    }

    setState("connecting");

    try {
      await connectFreighter();
      await refreshWallet();

      const info = await getWalletInfo();

      if (!info) {
        setState("denied");
        return;
      }

      if (!isSupportedNetwork(info.network)) {
        setState("wrong_network");
        return;
      }

      setState("connected");
      onConnected?.();

      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch {
      setState("denied");
    }
  };

  const isConnecting = state === "connecting" || state === "checking";
  const meta = CONNECTION_STATE_LABELS[state];

  if (state === "not_installed") {
    return (
      <Button size={size} variant="outline" className={className} asChild>
        <a
          href={FREIGHTER_INSTALL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={16} />
          Install Freighter
        </a>
      </Button>
    );
  }

  if (state === "connected" || connected) {
    return (
      <Button
        size={size}
        variant={variant === "default" ? "outline" : variant}
        className={className}
        onClick={() => redirectTo && router.push(redirectTo)}
      >
        {showLabel ? "Open Dashboard" : null}
      </Button>
    );
  }

  const button = (
    <Button
      size={size}
      variant={variant}
      onClick={handleConnect}
      disabled={isConnecting}
      className={inline ? className : "w-full sm:w-auto"}
    >
      {isConnecting ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Wallet size={16} />
      )}
      {showLabel
        ? isConnecting
          ? state === "checking"
            ? "Checking…"
            : "Connecting…"
          : state === "denied"
            ? "Try again"
            : label
        : null}
    </Button>
  );

  if (inline) {
    return button;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {button}

      {(state === "denied" || state === "wrong_network") && (
        <p className="text-xs text-warning">{meta.description}</p>
      )}
    </div>
  );
}
