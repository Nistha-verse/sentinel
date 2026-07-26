"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, Wallet } from "lucide-react";

import { useWallet } from "@/context/WalletContext";
import {
  connectWallet as connectFreighter,
  getWalletInfo,
  FREIGHTER_UNAVAILABLE_MESSAGE,
} from "@/services/freighter";
import { shouldUseWalletConnect } from "@/services/wallet-platform";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  type WalletConnectionState,
  detectWalletConnectionState,
  isSupportedNetwork,
  CONNECTION_STATE_LABELS,
} from "./wallet-states";

const FREIGHTER_INSTALL_URL = "https://www.freighter.app/";

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
  const { toast } = useToast();
  const [state, setState] = useState<WalletConnectionState>("checking");
  const [errorText, setErrorText] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    const detected = await detectWalletConnectionState();
    setState(detected);
  }, []);

  useEffect(() => {
    void refreshState();
  }, [refreshState, connected]);

  const handleConnect = async () => {
    setErrorText(null);
    const current = await detectWalletConnectionState();

    if (current === "not_installed" && !shouldUseWalletConnect()) {
      setState("not_installed");
      toast({
        variant: "warning",
        message: "Freighter not detected",
        description: FREIGHTER_UNAVAILABLE_MESSAGE,
      });
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
        setErrorText("Connection did not complete. Try again.");
        toast({
          variant: "error",
          message: "Connection failed",
          description: "Connection did not complete. Try again.",
        });
        return;
      }

      if (!isSupportedNetwork(info.network)) {
        setState("wrong_network");
        setErrorText(CONNECTION_STATE_LABELS.wrong_network.description);
        toast({
          variant: "warning",
          message: "Wrong network",
          description: CONNECTION_STATE_LABELS.wrong_network.description,
        });
        return;
      }

      setState("connected");
      toast({
        variant: "success",
        message: "Wallet connected",
        description: shouldUseWalletConnect()
          ? "Returned from Freighter Mobile successfully."
          : "Freighter extension connected.",
      });
      onConnected?.();

      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : FREIGHTER_UNAVAILABLE_MESSAGE;

      if (
        message.includes("not detected") ||
        message.includes("not configured") ||
        message.includes("Install Freighter")
      ) {
        setState("not_installed");
      } else {
        setState("denied");
      }

      setErrorText(message);
      toast({
        variant: "error",
        message: "Connection failed",
        description: message,
      });
    }
  };

  const isConnecting = state === "connecting" || state === "checking";
  const meta = CONNECTION_STATE_LABELS[state];

  if (state === "not_installed" && !shouldUseWalletConnect()) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Button size={size} variant="outline" asChild>
          <a
            href={FREIGHTER_INSTALL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={16} />
            Install Freighter
          </a>
        </Button>
        <p className="text-xs text-warning">{FREIGHTER_UNAVAILABLE_MESSAGE}</p>
      </div>
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
      onClick={() => void handleConnect()}
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

      {(state === "denied" ||
        state === "wrong_network" ||
        state === "not_installed") && (
        <p className="text-xs text-warning">{errorText ?? meta.description}</p>
      )}
    </div>
  );
}
