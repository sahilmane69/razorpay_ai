"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { exceptionLabel, formatINR } from "@/lib/format";
import type { ExceptionItem } from "@/lib/types";

type ExceptionCardProps = {
  item: ExceptionItem;
  resolved: boolean;
  onResolve: () => void;
  onLeave: () => void;
};

export function ExceptionCard({
  item,
  resolved,
  onResolve,
  onLeave,
}: ExceptionCardProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="text-sm font-medium text-ink">{item.orderId}</p>
        <p className="text-sm text-alert">{exceptionLabel(item.type)}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{item.explanation}</p>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Ledger amount</dt>
          <dd className="mt-0.5 font-medium text-ink">{formatINR(item.ledgerAmount)}</dd>
        </div>
        <div>
          <dt className="text-muted">Closest Razorpay candidate</dt>
          <dd className="mt-0.5 font-medium text-ink">
            {item.closestCandidate
              ? `${item.closestCandidate.paymentId} · ${formatINR(item.closestCandidate.amountGross)}`
              : "None found"}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {resolved ? (
          <p className="text-sm text-match">Marked resolved</p>
        ) : (
          <>
            <Button size="sm" onClick={onResolve}>
              Mark resolved
            </Button>
            <Button size="sm" variant="secondary" onClick={onLeave}>
              Leave for review
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
