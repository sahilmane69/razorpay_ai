import { PageContainer } from "@/components/layout/PageContainer";
import { ResultsView } from "@/components/reconcile/ResultsView";
import { formatDate } from "@/lib/format";
import { HISTORY_RUNS } from "@/lib/mock-data";
import { notFound } from "next/navigation";

type HistoryRunPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HistoryRunPage({ params }: HistoryRunPageProps) {
  const { id } = await params;
  const run = HISTORY_RUNS.find((item) => item.id === id);

  if (!run) notFound();

  return (
    <PageContainer>
      <ResultsView
        heading={`${formatDate(run.date)} reconciliation`}
        subheading={`${run.ledgerFile} · ${run.records} records · ${run.matchRate}% match rate`}
      />
    </PageContainer>
  );
}
