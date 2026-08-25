"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fetchRazorpayTransactions } from "@/lib/reconcile";
import { RAZORPAY_CONNECTION } from "@/lib/mock-data";
import { ArrowsClockwise, PlugsConnected } from "@phosphor-icons/react";
import { useState } from "react";

export function RazorpayConnection() {
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    await fetchRazorpayTransactions();
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
            <p className="text-sm font-medium text-ink">
              {RAZORPAY_CONNECTION.accountName}
            </p>
          </div>
          <Badge tone="matched">Connected</Badge>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm text-muted">
          <li>Payments available: {RAZORPAY_CONNECTION.paymentsAvailable}</li>
          <li>Settlements available: {RAZORPAY_CONNECTION.settlementsAvailable}</li>
        </ul>
      </div>

      <div className="mt-4">
        <Button variant="secondary" onClick={() => void refresh()} disabled={refreshing}>
          <ArrowsClockwise size={16} />
          {refreshing ? "Refreshing…" : "Refresh data"}
        </Button>
      </div>
    </Card>
  );
}
