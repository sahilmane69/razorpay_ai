"use client";

import { ExceptionsList } from "@/components/reconcile/ExceptionsList";
import { ReconciliationSummary } from "@/components/reconcile/ReconciliationSummary";
import { TransactionsTable } from "@/components/reconcile/TransactionsTable";
import { Button } from "@/components/ui/Button";
import { BATCH_SUMMARY, EXCEPTIONS, RESULTS } from "@/lib/mock-data";
import { exportResults } from "@/lib/reconcile";
import { DownloadSimple } from "@phosphor-icons/react";
import { useState } from "react";

type ResultsViewProps = {
  heading?: string;
  subheading?: string;
};

export function ResultsView({
  heading = "Reconciliation complete",
  subheading = `${BATCH_SUMMARY.resolved} of ${BATCH_SUMMARY.totalRecords} transactions were resolved automatically.`,
}: ResultsViewProps) {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div>
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">
          {heading}
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">
          {subheading}
        </p>
      </div>

      <div className="mt-8">
        <ReconciliationSummary summary={BATCH_SUMMARY} />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-base font-semibold text-ink">Transactions</h2>
        <TransactionsTable results={RESULTS} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-base font-semibold text-ink">Exceptions</h2>
        <ExceptionsList exceptions={EXCEPTIONS} />
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
                exportResults("csv", RESULTS);
                setExportOpen(false);
              }}
            >
              CSV
            </button>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-warm"
              onClick={() => {
                exportResults("json", RESULTS);
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
