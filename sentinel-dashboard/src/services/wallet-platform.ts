/**
 * Client-side platform detection for Freighter desktop vs mobile flows.
 * Freighter Mobile in-app browser injects `window.stellar.platform === "mobile"`.
 */

export type WalletPlatform = "desktop" | "mobile" | "freighter_mobile_browser";

declare global {
  interface Window {
    stellar?: {
      platform?: string;
    };
  }
}

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function isMobileUserAgent(): boolean {
  if (!isBrowser()) return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/** True when the page is opened inside Freighter Mobile's in-app browser. */
export function isFreighterMobileInAppBrowser(): boolean {
  if (!isBrowser()) return false;
  return window.stellar?.platform === "mobile";
}

/**
 * Prefer extension API when available (desktop extension or Freighter in-app browser).
 * Otherwise use WalletConnect for mobile Safari/Chrome.
 */
export function getWalletPlatform(): WalletPlatform {
  if (isFreighterMobileInAppBrowser()) return "freighter_mobile_browser";
  if (isMobileUserAgent()) return "mobile";
  return "desktop";
}

export function shouldUseWalletConnect(): boolean {
  return getWalletPlatform() === "mobile";
}

export function shouldUseExtensionApi(): boolean {
  const platform = getWalletPlatform();
  return platform === "desktop" || platform === "freighter_mobile_browser";
}
