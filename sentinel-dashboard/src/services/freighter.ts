import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
} from "@stellar/freighter-api";

/**
 * Check if Freighter extension is installed
 */
export async function isFreighterInstalled() {
  try {
    return await isConnected();
  } catch {
    return false;
  }
}

/**
 * Connect wallet (asks for permission only once)
 */
export async function connectWallet() {
  const result = await requestAccess();

  if ("error" in result) {
    throw new Error(result.error);
  }

  return result.address;
}

/**
 * Get connected wallet address
 */
export async function getWalletAddress() {
  const result = await getAddress();

  if ("error" in result) {
    return null;
  }

  return result.address;
}

/**
 * Get current Stellar network
 */
export async function getWalletNetwork() {
  const result = await getNetwork();

  if ("error" in result) {
    return null;
  }

  return result.network;
}

/**
 * Check whether the user already granted permission
 */
export async function isWalletAuthorized() {
  const address = await getWalletAddress();
  return address !== null;
}
export async function getWalletInfo() {
  const address = await getWalletAddress();
  const network = await getWalletNetwork();

  if (!address || !network) {
    return null;
  }

  return { address, network };
}