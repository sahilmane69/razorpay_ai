"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowsClockwise, PlugsConnected } from "@phosphor-icons/react";
import { useState } from "react";

type RazorpayConnectionProps = {
  connected: boolean;
  stored: number;
  onSynced?: (count: number) => void;
};

export function RazorpayConnection({
  connected,
  stored,
  onSynced,
}: RazorpayConnectionProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(connected);
  const [storedCount, setStoredCount] = useState(stored);
  const [error, setError] = useState("");

  async function loadStatus() {
    const response = await fetch("/api/razorpay/sync");
    const payload = (await response.json()) as {
      connected?: boolean;
      stored?: number;
    };
    if (response.ok) {
      setIsConnected(Boolean(payload.connected));
      setStoredCount(payload.stored ?? 0);
    }
  }

  async function refresh() {
    setRefreshing(true);
    setError("");
    if (isConnected) {
      const response = await fetch("/api/razorpay/sync", { method: "POST" });
      const payload = (await response.json()) as { error?: string; synced?: number };
      if (!response.ok) {
        setError(payload.error ?? "Could not sync Razorpay. Please try again.");
        setRefreshing(false);
        return;
      }
      onSynced?.(payload.synced ?? 0);
    } else {
      const seed = await fetch("/api/evaluation/seed", { method: "POST" });
      const payload = (await seed.json()) as { error?: string; seeded?: number };
      if (!seed.ok) {
        setError(payload.error ?? "Could not load Razorpay sample data.");
        setRefreshing(false);
        return;
      }
      onSynced?.(payload.seeded ?? 0);
    }
    await loadStatus();
    setRefreshing(false);
  }

  return (
    <Card className="flex h-full flex-col p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Step 2
      </p>
      <h2 className="mt-1 text-base font-semibold text-ink">Razorpay</h2>
      <p className="mt-1 text-sm text-muted">
        Compare against payments and settlements from your connected account.
      </p>

      <div className="mt-5 flex flex-1 flex-col justify-center rounded-[12px] bg-warm px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <PlugsConnected size={20} className="text-primary" />
            <p className="text-sm font-medium text-ink">Razorpay</p>
          </div>
          <Badge tone={isConnected || storedCount > 0 ? "matched" : "review"}>
            {isConnected || storedCount > 0 ? "Connected" : "Not connected"}
          </Badge>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          <li>
            {isConnected ? "Payments sync available" : `${storedCount} payments available`}
          </li>
          <li>
            {isConnected ? "Settlements sync available" : "Use Sync Razorpay before you run"}
          </li>
        </ul>
      </div>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => void refresh()} disabled={refreshing}>
          <ArrowsClockwise size={16} />
          {refreshing ? "Syncing…" : "Sync Razorpay"}
        </Button>
      </div>
      {error && <p className="mt-3 text-sm text-alert">{error}</p>}
    </Card>
  );
}
