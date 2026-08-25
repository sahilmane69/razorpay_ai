"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { useState } from "react";

type SettingsViewProps = {
  businessName: string;
  ownerName: string;
  email: string;
  razorpayConnected: boolean;
};

export function SettingsView({
  businessName,
  ownerName,
  email,
  razorpayConnected,
}: SettingsViewProps) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/razorpay/sync", { method: "POST" });
    const payload = (await response.json()) as { error?: string; synced?: number };
    setBusy(false);
    setMessage(
      response.ok
        ? `Synced ${payload.synced ?? 0} Razorpay records.`
        : payload.error ?? "Could not sync Razorpay. Please try again."
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-2 text-[15px] text-muted">Business and Razorpay connection.</p>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-ink">Business</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Business name</dt>
            <dd className="font-medium text-ink">{businessName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Owner</dt>
            <dd className="font-medium text-ink">{ownerName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-ink">{email}</dd>
          </div>
        </dl>
      </Card>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Razorpay</h2>
          <Badge tone={razorpayConnected ? "matched" : "review"}>
            {razorpayConnected ? "Connected" : "Not connected"}
          </Badge>
        </div>
        {razorpayConnected ? (
          <ul className="mt-4 space-y-1.5 text-sm text-muted">
            <li>Payments sync available</li>
            <li>Settlements sync available</li>
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Add Razorpay keys in the server environment to enable sync.
          </p>
        )}
        <div className="mt-4">
          <Button variant="secondary" onClick={() => void sync()} disabled={!razorpayConnected || busy}>
            <ArrowsClockwise size={16} />
            {busy ? "Syncing…" : "Sync Razorpay"}
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-muted">{message}</p>}
      </Card>
    </div>
  );
}
