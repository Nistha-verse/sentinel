/**
 * Freighter browser extension / in-app browser path via @stellar/freighter-api.
 */

import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
} from "@stellar/freighter-api";

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (typeof error === "string" && error.trim()) return error;
  return "Freighter request failed";
}

export async function extensionIsInstalled(): Promise<boolean> {
  try {
    const result = await isConnected();
    if (typeof result === "boolean") return result;
    if (result && typeof result === "object" && "isConnected" in result) {
      return Boolean((result as { isConnected: boolean }).isConnected);
    }
    return false;
  } catch {
    return false;
  }
}

export async function extensionConnect(): Promise<string> {
  const installed = await extensionIsInstalled();
  if (!installed) {
    throw new Error(
      "Freighter not detected. Install Freighter or open using the Freighter mobile app."
    );
  }

  const result = await requestAccess();

  if (result && typeof result === "object" && "error" in result && result.error) {
    throw new Error(errorMessage(result.error));
  }

  const address =
    result && typeof result === "object" && "address" in result
      ? (result as { address?: string }).address
      : undefined;

  if (!address) {
    throw new Error("Access denied. Approve the connection in Freighter to continue.");
  }

  return address;
}

export async function extensionGetAddress(): Promise<string | null> {
  try {
    const result = await getAddress();
    if (result && typeof result === "object" && "error" in result && result.error) {
      return null;
    }
    if (result && typeof result === "object" && "address" in result) {
      return (result as { address?: string }).address ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function extensionGetNetwork(): Promise<string | null> {
  try {
    const result = await getNetwork();
    if (result && typeof result === "object" && "error" in result && result.error) {
      return null;
    }
    if (result && typeof result === "object" && "network" in result) {
      return (result as { network?: string }).network ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function extensionGetWalletInfo(): Promise<{
  address: string;
  network: string;
} | null> {
  const address = await extensionGetAddress();
  const network = await extensionGetNetwork();
  if (!address || !network) return null;
  return { address, network };
}
