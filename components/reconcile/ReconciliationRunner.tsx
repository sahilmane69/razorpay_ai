"use client";

import { ProgressSteps } from "@/components/reconcile/ProgressSteps";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RECONCILE_STAGES, runReconciliation } from "@/lib/reconcile";
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

  async function handleRun() {
    if (!upload) return;
    setRunning(true);
    setStageIndex(0);
    await runReconciliation((index) => setStageIndex(index));
    router.push("/reconcile/results");
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

      <div className="mt-4">
        <Button onClick={() => void handleRun()} disabled={!upload || running}>
          {running ? "Working…" : "Run reconciliation"}
        </Button>
      </div>
    </Card>
  );
}
