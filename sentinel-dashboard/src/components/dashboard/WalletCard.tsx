"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, CircleCheckBig, CircleOff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import WalletConnectionStatus from "@/components/wallet/WalletConnectionStatus";

interface WalletCardProps {
  connected?: boolean;
  address?: string;
  network?: string;
}

export default function WalletCard({
  connected = false,
  address,
  network,
}: WalletCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="h-full transition-colors hover:border-primary/20 hover:bg-hover">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label text-muted-foreground">Identity</p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                Wallet
              </h3>
            </div>
            <div className="flex size-8 items-center justify-center rounded-md border border-border bg-muted">
              <Wallet size={15} className="text-primary" />
            </div>
          </div>

          <div className="mt-5">
            {connected ? (
              <>
                <Badge variant="success" className="mb-4">
                  <CircleCheckBig size={12} className="mr-1" />
                  Connected
                </Badge>

                <div className="space-y-3">
                  <div>
                    <p className="text-label text-muted-foreground">
                      Public address
                    </p>
                    <p className="mt-1.5 rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-foreground break-all">
                      {address}
                    </p>
                  </div>

                  <div>
                    <p className="text-label text-muted-foreground">Network</p>
                    <p className="mt-1.5 text-sm font-medium text-primary">
                      {network}
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="sm" className="mt-4" asChild>
                  <Link href="/wallet">Manage wallet →</Link>
                </Button>
              </>
            ) : (
              <>
                <WalletConnectionStatus layout="card" className="mb-3" />

                <div className="flex items-center gap-2 text-muted-foreground">
                  <CircleOff size={14} />
                  <span className="text-small font-medium">
                    Wallet not connected
                  </span>
                </div>

                <p className="mt-3 text-small leading-relaxed text-text-secondary">
                  Use the navbar or landing page to connect Freighter. This card
                  shows your identity once connected.
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
