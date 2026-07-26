/**
 * Session persistence for wallet connection metadata only.
 * Does not store keys or signing material.
 */

export type WalletConnectionMode = "extension" | "walletconnect";

export interface WalletSession {
  address: string;
  network: string;
  mode: WalletConnectionMode;
  connectedAt: string;
}

const SESSION_KEY = "sentinel_wallet_session";

export function saveWalletSession(session: WalletSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore quota / private mode
  }
}

export function loadWalletSession(): WalletSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WalletSession;
    if (
      typeof parsed.address !== "string" ||
      typeof parsed.network !== "string" ||
      (parsed.mode !== "extension" && parsed.mode !== "walletconnect")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearWalletSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
