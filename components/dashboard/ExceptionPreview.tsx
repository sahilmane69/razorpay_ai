import { buttonClassName } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { exceptionLabel } from "@/lib/format";
import type { ExceptionItem } from "@/lib/types";
import Link from "next/link";

type ExceptionPreviewProps = {
  exceptions: ExceptionItem[];
  runId?: string;
};

export function ExceptionPreview({ exceptions, runId }: ExceptionPreviewProps) {
  if (exceptions.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-ink">
        Exceptions needing attention
      </h2>
      <div className="space-y-3">
        {exceptions.map((item) => (
          <Card
            key={item.id ?? item.orderId}
            className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-medium text-ink">
                Order {item.orderId}
                <span className="ml-2 font-normal text-muted">
                  {exceptionLabel(item.type)}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted">{item.explanation}</p>
            </div>
            <Link
              href={runId ? `/reconcile/results?run=${runId}` : "/reconcile/results"}
              className={buttonClassName("secondary", "sm")}
            >
              Review
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
