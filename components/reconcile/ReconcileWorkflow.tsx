"use client";

import { LedgerUploader } from "@/components/reconcile/LedgerUploader";
import { RazorpayConnection } from "@/components/reconcile/RazorpayConnection";
import { ReconciliationRunner } from "@/components/reconcile/ReconciliationRunner";
import type { LedgerUpload } from "@/lib/types";
import { useState } from "react";

export function ReconcileWorkflow() {
  const [upload, setUpload] = useState<LedgerUpload | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <LedgerUploader upload={upload} onUpload={setUpload} />
      <RazorpayConnection />
      <ReconciliationRunner upload={upload} />
    </div>
  );
}
