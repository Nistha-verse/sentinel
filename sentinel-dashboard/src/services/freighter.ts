/**
 * Freighter wallet facade — desktop extension + Freighter Mobile (WalletConnect).
 * Preserves the existing service API used by WalletContext and UI components.
 */

import {
  shouldUseExtensionApi,
  shouldUseWalletConnect,
  isFreighterMobileInAppBrowser,
  getWalletPlatform,
} from "./wallet-platform";
import {
  extensionConnect,
  extensionGetAddress,
  extensionGetNetwork,
  extensionGetWalletInfo,
  extensionIsInstalled,
} from "./freighter-extension";
import {
  mobileConnect,
  mobileDisconnect,
  mobileGetWalletInfo,
  mobileIsAvailable,
  setMobileSessionEndHandler,
} from "./freighter-mobile";
import {
  clearWalletSession,
  loadWalletSession,
  saveWalletSession,
  type WalletConnectionMode,
} from "./wallet-session";

export const FREIGHTER_UNAVAILABLE_MESSAGE =
  "Freighter not detected. Install Freighter or open using the Freighter mobile app.";

export type { WalletConnectionMode };

export function onMobileSessionEnd(handler: () => void): void {
  setMobileSessionEndHandler(handler);
}

/**
 * Check if a Freighter connection path is available on this device.
 */
export async function isFreighterInstalled(): Promise<boolean> {
  if (shouldUseWalletConnect()) {
    // Mobile browser: WalletConnect can open Freighter app (or show install links)
    const wcReady = await mobileIsAvailable();
    if (wcReady) return true;
    // Fallback: Freighter in-app browser injects stellar platform
    return isFreighterMobileInAppBrowser();
  }

  return extensionIsInstalled();
}

/**
 * Connect wallet (asks for permission).
 * Desktop / Freighter in-app browser → extension API
 * Mobile browser → WalletConnect → Freighter Mobile deep link
 */
export async function connectWallet(): Promise<string> {
  if (shouldUseWalletConnect()) {
    try {
      const info = await mobileConnect();
      saveWalletSession({
        address: info.address,
        network: info.network,
        mode: "walletconnect",
        connectedAt: new Date().toISOString(),
      });
      return info.address;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : FREIGHTER_UNAVAILABLE_MESSAGE;
      // If WC project id missing or Freighter unavailable, surface clear guidance
      if (
        message.includes("WalletConnect is not configured") ||
        message.toLowerCase().includes("not detected")
      ) {
        throw new Error(message);
      }
      throw new Error(message);
    }
  }

  const address = await extensionConnect();
  const network = (await extensionGetNetwork()) ?? "TESTNET";
  saveWalletSession({
    address,
    network,
    mode: "extension",
    connectedAt: new Date().toISOString(),
  });
  return address;
}

export async function getWalletAddress(): Promise<string | null> {
  if (shouldUseWalletConnect()) {
    const session = loadWalletSession();
    if (session?.mode === "walletconnect") {
      const live = await mobileGetWalletInfo();
      if (live) return live.address;
      return session.address;
    }
    const live = await mobileGetWalletInfo();
    return live?.address ?? null;
  }

  return extensionGetAddress();
}

export async function getWalletNetwork(): Promise<string | null> {
  if (shouldUseWalletConnect()) {
    const session = loadWalletSession();
    if (session?.mode === "walletconnect") {
      const live = await mobileGetWalletInfo();
      if (live) return live.network;
      return session.network;
    }
    const live = await mobileGetWalletInfo();
    return live?.network ?? null;
  }

  return extensionGetNetwork();
}

export async function isWalletAuthorized(): Promise<boolean> {
  const address = await getWalletAddress();
  return address !== null;
}

export async function getWalletInfo(): Promise<{
  address: string;
  network: string;
} | null> {
  const session = loadWalletSession();

  if (shouldUseWalletConnect() || session?.mode === "walletconnect") {
    const live = await mobileGetWalletInfo();
    if (live) {
      saveWalletSession({
        address: live.address,
        network: live.network,
        mode: "walletconnect",
        connectedAt: session?.connectedAt ?? new Date().toISOString(),
      });
      return live;
    }

    // Restore last WC session metadata after return-to-dapp (page reload)
    if (session?.mode === "walletconnect") {
      return { address: session.address, network: session.network };
    }

    // Mobile user may still be in Freighter in-app browser
    if (shouldUseExtensionApi()) {
      return extensionGetWalletInfo();
    }

    return null;
  }

  const info = await extensionGetWalletInfo();
  if (info) {
    saveWalletSession({
      address: info.address,
      network: info.network,
      mode: "extension",
      connectedAt: session?.connectedAt ?? new Date().toISOString(),
    });
    return info;
  }

  // Extension gone but we had a cached session — clear stale state
  if (session?.mode === "extension") {
    clearWalletSession();
  }

  return null;
}

export async function disconnectWallet(): Promise<void> {
  const session = loadWalletSession();
  if (session?.mode === "walletconnect" || shouldUseWalletConnect()) {
    await mobileDisconnect();
  }
  clearWalletSession();
}

export function getActiveConnectionMode(): WalletConnectionMode | null {
  return loadWalletSession()?.mode ?? null;
}

export function getDetectedPlatform() {
  return getWalletPlatform();
}
