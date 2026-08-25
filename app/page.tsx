import { ExceptionPreview } from "@/components/dashboard/ExceptionPreview";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { PageContainer } from "@/components/layout/PageContainer";
import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { percentLabel } from "@/lib/format";
import { loadRunBundle } from "@/lib/queries/runs";
import Link from "next/link";

export default async function HomePage() {
  const bundle = await loadRunBundle();

  return (
    <PageContainer>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">
            Finance reconciliation
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">
            Match your books with Razorpay settlements and review only what needs
            attention.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/reconcile" className={buttonClassName("primary")}>
            Run reconciliation
          </Link>
          <Link href="/reconcile" className={buttonClassName("secondary")}>
            Upload ledger
          </Link>
        </div>
      </div>

      {!bundle ? (
        <Card className="mt-8 p-8">
          <h2 className="text-base font-semibold text-ink">No reconciliations yet</h2>
          <p className="mt-2 text-sm text-muted">
            Upload your ledger and run your first reconciliation.
          </p>
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Match rate"
              value={percentLabel(bundle.summary.matchRate)}
              hint={`${bundle.summary.resolved} of ${bundle.summary.totalRecords} records resolved`}
            />
            <MetricCard
              label="Accuracy"
              value={percentLabel(bundle.summary.accuracy)}
              hint={
                bundle.summary.accuracy === null
                  ? "Available on evaluation datasets"
                  : "Verified against ground truth"
              }
            />
            <MetricCard
              label="Needs review"
              value={String(bundle.summary.unresolved)}
              hint="Unresolved exceptions"
            />
            <MetricCard
              label="Processing time"
              value={`${bundle.summary.processingTimeSeconds}s`}
              hint={`${bundle.summary.totalRecords} records processed`}
            />
          </div>

          <div className="mt-10">
            <RecentTransactions results={bundle.results.slice(0, 8)} />
          </div>

          <div className="mt-10">
            <ExceptionPreview
              exceptions={bundle.exceptions.filter((item) => item.status !== "RESOLVED").slice(0, 3)}
              runId={bundle.run.id}
            />
          </div>
        </>
      )}
    </PageContainer>
  );
}
