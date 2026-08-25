"use client";

import { ProgressSteps } from "@/components/reconcile/ProgressSteps";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RECONCILE_STAGES } from "@/lib/reconcile";
import type { LedgerUpload } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ReconciliationRunnerProps = {
  upload: LedgerUpload | null;
};

export function ReconciliationRunner({ upload }: ReconciliationRunnerProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState("");

  async function handleRun() {
    if (!upload) return;
    setRunning(true);
    setError("");
    setStageIndex(0);

    setStageIndex(1);
    const sync = await fetch("/api/razorpay/sync", { method: "POST" });
    if (!sync.ok) {
      await fetch("/api/evaluation/seed", { method: "POST" });
    }

    setStageIndex(2);
    const response = await fetch("/api/reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ledgerUploadId: upload.id }),
    });
    const payload = (await response.json()) as { error?: string; runId?: string };

    if (!response.ok || !payload.runId) {
      setError(payload.error ?? "Could not finish reconciliation. Please try again.");
      setRunning(false);
      return;
    }

    setStageIndex(RECONCILE_STAGES.length);
    router.push(`/reconcile/results?run=${payload.runId}`);
  }

  return (
    <Card className="flex h-full flex-col p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Step 3
      </p>
      <h2 className="mt-1 text-base font-semibold text-ink">Run reconciliation</h2>
      <p className="mt-1 text-sm text-muted">
        We&apos;ll first use deterministic matching, then AI only for ambiguous
        records.
      </p>

      <div className="mt-5 flex-1">
        {running ? (
          <ProgressSteps stages={RECONCILE_STAGES} currentIndex={stageIndex} />
        ) : (
          <p className="text-sm text-muted">
            {upload
              ? `${upload.fileName} is ready to compare with Razorpay.`
              : "Upload a ledger to start."}
          </p>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-alert">{error}</p>}

      <div className="mt-4">
        <Button onClick={() => void handleRun()} disabled={!upload || running}>
          {running ? "Working…" : "Run reconciliation"}
        </Button>
      </div>
    </Card>
  );
}
