"use client";

import { ExceptionsList } from "@/components/reconcile/ExceptionsList";
import { ReconciliationSummary } from "@/components/reconcile/ReconciliationSummary";
import { TransactionsTable } from "@/components/reconcile/TransactionsTable";
import { Button } from "@/components/ui/Button";
import { exportResults } from "@/lib/reconcile";
import type { BatchSummary, ExceptionItem, ReconciliationResult } from "@/lib/types";
import { DownloadSimple } from "@phosphor-icons/react";
import { useState } from "react";

type ResultsViewProps = {
  heading?: string;
  subheading?: string;
  summary: BatchSummary;
  results: ReconciliationResult[];
  exceptions: ExceptionItem[];
};

export function ResultsView({
  heading = "Reconciliation complete",
  subheading,
  summary,
  results,
  exceptions,
}: ResultsViewProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const resolvedText =
    subheading ??
    `${summary.resolved} of ${summary.totalRecords} transactions were resolved automatically.`;

  return (
    <div>
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">
          {heading}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">
          {resolvedText}
        </p>
      </div>

      <div className="mt-8">
        <ReconciliationSummary summary={summary} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-base font-semibold text-ink">Transactions</h2>
        <TransactionsTable results={results} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-base font-semibold text-ink">Exceptions</h2>
        <ExceptionsList exceptions={exceptions} />
      </section>

      <div className="relative mt-8 flex justify-end">
        <Button variant="secondary" onClick={() => setExportOpen((open) => !open)}>
          <DownloadSimple size={16} />
          Export report
        </Button>
        {exportOpen && (
          <div className="absolute bottom-12 right-0 z-20 w-36 overflow-hidden rounded-[12px] border border-line bg-surface shadow-[0_8px_24px_rgba(28,25,23,0.08)]">
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-warm"
              onClick={() => {
                exportResults("csv", results);
                setExportOpen(false);
              }}
            >
              CSV
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-warm"
              onClick={() => {
                exportResults("json", results);
                setExportOpen(false);
              }}
            >
              JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
