import { PageContainer } from "@/components/layout/PageContainer";
import { ResultsView } from "@/components/reconcile/ResultsView";
import { Card } from "@/components/ui/Card";
import { buttonClassName } from "@/components/ui/Button";
import { loadRunBundle } from "@/lib/queries/runs";
import Link from "next/link";

type ResultsPageProps = {
  searchParams: Promise<{ run?: string }>;
};

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const { run } = await searchParams;
  const bundle = await loadRunBundle(run);

  if (!bundle) {
    return (
      <PageContainer>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">
          Reconciliation complete
        </h1>
        <Card className="mt-8 p-8">
          <p className="text-sm text-muted">
            No reconciliation is available yet. Upload your ledger and run your first
            reconciliation.
          </p>
          <Link href="/reconcile" className={`${buttonClassName("primary")} mt-4`}>
            Run reconciliation
          </Link>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ResultsView
        summary={bundle.summary}
        results={bundle.results}
        exceptions={bundle.exceptions}
      />
    </PageContainer>
  );
}
