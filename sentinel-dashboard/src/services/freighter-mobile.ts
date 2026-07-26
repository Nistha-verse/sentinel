/**
 * Freighter Mobile via WalletConnect v2 (official Freighter docs).
 * Used when the dapp runs in a mobile browser (Safari / Chrome), not the extension.
 */

type AppKitModal = {
  open: () => void;
  close: () => void;
};

type StellarSession = {
  topic: string;
  namespaces: {
    stellar?: {
      accounts: string[];
      methods: string[];
      chains: string[];
    };
  };
};

/** Minimal surface we use from WalletConnect UniversalProvider. */
type FreighterWcProvider = {
  connect: (opts: {
    namespaces: {
      stellar: {
        methods: string[];
        chains: string[];
        events: string[];
      };
    };
  }) => Promise<StellarSession | undefined>;
  disconnect: () => Promise<void>;
  session?: StellarSession;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
};

let providerPromise: Promise<FreighterWcProvider> | null = null;
let modal: AppKitModal | null = null;
let listenersAttached = false;

const STELLAR_METHODS = [
  "stellar_signXDR",
  "stellar_signAndSubmitXDR",
  "stellar_signMessage",
  "stellar_signAuthEntry",
] as const;

function getProjectId(): string {
  const id = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim();
  if (!id) {
    throw new Error(
      "WalletConnect is not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to enable Freighter Mobile."
    );
  }
  return id;
}

function getAppUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://sentinel.app";
}

function parseAccount(account: string): { chain: string; address: string } | null {
  // Format: "stellar:pubnet:G..." or "stellar:testnet:G..."
  const parts = account.split(":");
  if (parts.length < 3) return null;
  const address = parts[parts.length - 1];
  const chain = parts.slice(0, -1).join(":");
  if (!address.startsWith("G")) return null;
  return { chain, address };
}

function chainToNetwork(chain: string): string {
  const lower = chain.toLowerCase();
  if (lower.includes("testnet") || lower.includes("test")) return "TESTNET";
  if (
    lower.includes("pubnet") ||
    lower.includes("public") ||
    lower.includes("mainnet")
  ) {
    return "PUBLIC";
  }
  return "PUBLIC";
}

async function initProvider(): Promise<FreighterWcProvider> {
  if (!providerPromise) {
    providerPromise = (async () => {
      const { default: UniversalProvider } = await import(
        "@walletconnect/universal-provider"
      );
      const { createAppKit } = await import("@reown/appkit/core");
      const { mainnet } = await import("@reown/appkit/networks");

      const projectId = getProjectId();

      const provider = (await UniversalProvider.init({
        projectId,
        metadata: {
          name: "Sentinel",
          description: "Soroban smart contract security platform",
          url: getAppUrl(),
          icons: [`${getAppUrl()}/favicon.ico`],
        },
      })) as FreighterWcProvider;

      modal = createAppKit({
        projectId,
        networks: [mainnet],
        universalProvider: provider as never,
        manualWCControl: true,
      }) as unknown as AppKitModal;

      return provider;
    })();
  }

  return providerPromise;
}

function attachSessionListeners(
  provider: FreighterWcProvider,
  onSessionEnd?: () => void
): void {
  if (listenersAttached) return;
  listenersAttached = true;

  provider.on("session_delete", () => {
    onSessionEnd?.();
  });
  provider.on("session_expire", () => {
    onSessionEnd?.();
  });
}

export function setMobileSessionEndHandler(handler: () => void): void {
  void initProvider()
    .then((provider) => attachSessionListeners(provider, handler))
    .catch(() => {
      // Provider may be unavailable until project id is set
    });
}

export async function mobileIsAvailable(): Promise<boolean> {
  try {
    getProjectId();
    return true;
  } catch {
    return false;
  }
}

export async function mobileConnect(): Promise<{
  address: string;
  network: string;
}> {
  const provider = await initProvider();
  attachSessionListeners(provider);

  modal?.open();

  try {
    const session = await provider.connect({
      namespaces: {
        stellar: {
          methods: [...STELLAR_METHODS],
          chains: ["stellar:pubnet", "stellar:testnet"],
          events: ["accountsChanged"],
        },
      },
    });

    if (!session) {
      throw new Error(
        "Connection failed. Approve the request in Freighter Mobile."
      );
    }

    const accounts = session.namespaces.stellar?.accounts ?? [];
    const parsed = accounts[0] ? parseAccount(accounts[0]) : null;
    if (!parsed) {
      throw new Error("Freighter Mobile did not return a Stellar address.");
    }

    return {
      address: parsed.address,
      network: chainToNetwork(parsed.chain),
    };
  } finally {
    modal?.close();
  }
}

export async function mobileGetWalletInfo(): Promise<{
  address: string;
  network: string;
} | null> {
  try {
    const provider = await initProvider();
    const session = provider.session;
    const accounts = session?.namespaces?.stellar?.accounts ?? [];
    if (!accounts.length) return null;

    const parsed = parseAccount(accounts[0]);
    if (!parsed) return null;

    return {
      address: parsed.address,
      network: chainToNetwork(parsed.chain),
    };
  } catch {
    return null;
  }
}

export async function mobileDisconnect(): Promise<void> {
  try {
    const provider = await initProvider();
    if (provider.session) {
      await provider.disconnect();
    }
  } catch {
    // ignore disconnect errors
  }
}
