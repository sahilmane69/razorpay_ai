import { ExceptionPreview } from "@/components/dashboard/ExceptionPreview";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { PageContainer } from "@/components/layout/PageContainer";
import { buttonClassName } from "@/components/ui/Button";
import { BATCH_SUMMARY, EXCEPTIONS, RESULTS } from "@/lib/mock-data";
import Link from "next/link";

const recent = RESULTS.filter((result) =>
  ["ORD-1038", "ORD-1041", "ORD-1052", "ORD-1042"].includes(result.orderId)
);

export default function HomePage() {
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

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Match rate"
          value={`${BATCH_SUMMARY.matchRate}%`}
          hint={`${BATCH_SUMMARY.resolved} of ${BATCH_SUMMARY.totalRecords} records resolved`}
        />
        <MetricCard
          label="Accuracy"
          value={`${BATCH_SUMMARY.accuracy}%`}
          hint="Verified against ground truth"
        />
        <MetricCard
          label="Needs review"
          value={String(BATCH_SUMMARY.unresolved)}
          hint="Unresolved exceptions"
        />
        <MetricCard
          label="Processing time"
          value={`${BATCH_SUMMARY.processingTimeSeconds}s`}
          hint={`${BATCH_SUMMARY.totalRecords} records processed`}
        />
      </div>

      <div className="mt-10">
        <RecentTransactions results={recent} />
      </div>

      <div className="mt-10">
        <ExceptionPreview exceptions={EXCEPTIONS} />
      </div>
    </PageContainer>
  );
}
