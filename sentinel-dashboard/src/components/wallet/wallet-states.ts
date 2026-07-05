import {
  getWalletInfo,
  isFreighterInstalled,
  isWalletAuthorized,
} from "@/services/freighter";

export type WalletConnectionState =
  | "idle"
  | "checking"
  | "not_installed"
  | "connecting"
  | "denied"
  | "wrong_network"
  | "connected"
  | "disconnected";

/** Networks Sentinel supports for Soroban development */
export const SUPPORTED_NETWORKS = ["TESTNET", "PUBLIC"] as const;

export function isSupportedNetwork(network: string | null): boolean {
  if (!network) return false;
  return SUPPORTED_NETWORKS.includes(
    network.toUpperCase() as (typeof SUPPORTED_NETWORKS)[number]
  );
}

export async function detectWalletConnectionState(): Promise<WalletConnectionState> {
  try {
    const installed = await isFreighterInstalled();
    if (!installed) return "not_installed";

    const authorized = await isWalletAuthorized();
    if (!authorized) return "disconnected";

    const info = await getWalletInfo();
    if (!info) return "disconnected";

    if (!isSupportedNetwork(info.network)) return "wrong_network";

    return "connected";
  } catch {
    return "disconnected";
  }
}

export const CONNECTION_STATE_LABELS: Record<
  WalletConnectionState,
  { label: string; description: string }
> = {
  idle: { label: "Ready", description: "Click to connect your Freighter wallet." },
  checking: {
    label: "Checking",
    description: "Verifying Freighter extension status…",
  },
  not_installed: {
    label: "Not installed",
    description: "Install the Freighter browser extension to continue.",
  },
  connecting: {
    label: "Connecting",
    description: "Approve the connection request in Freighter…",
  },
  denied: {
    label: "Access denied",
    description: "Connection was rejected. Try again when you're ready.",
  },
  wrong_network: {
    label: "Wrong network",
    description: "Switch Freighter to Testnet or Mainnet (Public).",
  },
  connected: {
    label: "Connected",
    description: "Wallet connected and ready.",
  },
  disconnected: {
    label: "Disconnected",
    description: "Connect Freighter to access your Soroban projects.",
  },
};
