"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import AppLayout from "@/components/layout/Applayout";
import {
  getWalletAddress,
  getWalletNetwork,
} from "@/services/freighter";

export default function WalletPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWallet() {
      try {
        const walletAddress = await getWalletAddress();
        const walletNetwork = await getWalletNetwork();

        setAddress(walletAddress);
        setNetwork(walletNetwork);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadWallet();
  }, []);

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#0B0F0D] p-8 text-white">
        <h1 className="text-4xl font-bold text-emerald-400">Wallet</h1>

        <p className="mt-2 text-zinc-400">
          Connected Freighter wallet information.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">

          {loading ? (
            <p className="text-zinc-400">
              Loading wallet...
            </p>
          ) : (
            <>
              <div className="space-y-6">

                <div>
                  <p className="text-sm uppercase tracking-widest text-zinc-500">
                    Status
                  </p>

                  <p className="mt-2 text-lg font-semibold text-emerald-400">
                    {address ? "Connected ✓" : "Not Connected"}
                  </p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-widest text-zinc-500">
                    Wallet Address
                  </p>

                  <p className="mt-2 break-all font-mono text-white">
                    {address ?? "--"}
                  </p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-widest text-zinc-500">
                    Network
                  </p>

                  <p className="mt-2 text-emerald-400">
                    {network ?? "--"}
                  </p>
                </div>

              </div>

              {address && (
                <Link
                  href="/dashboard"
                  className="mt-10 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-600"
                >
                  Continue to Dashboard →
                </Link>
              )}
            </>
          )}

        </div>
      </div>
    </AppLayout>
  );
}