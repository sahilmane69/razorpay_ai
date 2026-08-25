import { HistoryTable } from "@/components/history/HistoryTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { loadHistory } from "@/lib/queries/runs";

export default async function HistoryPage() {
  const runs = await loadHistory();

  return (
    <PageContainer>
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">
        Reconciliation history
      </h1>
      <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">
        Open a past run to see how it was matched and what still needs review.
      </p>
      <div className="mt-8">
        <HistoryTable runs={runs} />
      </div>
    </PageContainer>
  );
}
