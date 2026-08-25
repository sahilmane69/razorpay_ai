import { Card } from "@/components/ui/Card";
import { percentLabel } from "@/lib/format";
import type { BatchSummary } from "@/lib/types";

type ReconciliationSummaryProps = {
  summary: BatchSummary;
};

export function ReconciliationSummary({ summary }: ReconciliationSummaryProps) {
  const metrics = [
    { label: "Match rate", value: percentLabel(summary.matchRate) },
    { label: "Accuracy", value: percentLabel(summary.accuracy) },
    { label: "Auto-resolved", value: String(summary.resolved) },
    { label: "Needs review", value: String(summary.unresolved) },
  ];

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="px-5 py-4">
            <p className="text-sm text-muted">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              {metric.value}
            </p>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        Exact matches: {summary.exactMatches}
        <span className="mx-2 text-line">·</span>
        Rule-based: {summary.ruleBased}
        <span className="mx-2 text-line">·</span>
        AI assisted: {summary.aiAssisted}
        <span className="mx-2 text-line">·</span>
        Processed in {summary.processingTimeSeconds}s
      </p>
    </div>
  );
}
