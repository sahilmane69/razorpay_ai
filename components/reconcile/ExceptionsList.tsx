"use client";

import { ExceptionCard } from "@/components/reconcile/ExceptionCard";
import type { ExceptionItem } from "@/lib/types";
import { useState } from "react";

type ExceptionsListProps = {
  exceptions: ExceptionItem[];
};

export function ExceptionsList({ exceptions }: ExceptionsListProps) {
  const [resolved, setResolved] = useState<string[]>([]);
  const [kept, setKept] = useState<string[]>([]);

  return (
    <div className="space-y-3">
      {exceptions.map((item) => (
        <ExceptionCard
          key={item.orderId}
          item={item}
          resolved={resolved.includes(item.orderId)}
          onResolve={() =>
            setResolved((current) =>
              current.includes(item.orderId) ? current : [...current, item.orderId]
            )
          }
          onLeave={() =>
            setKept((current) =>
              current.includes(item.orderId) ? current : [...current, item.orderId]
            )
          }
        />
      ))}
      {kept.length > 0 && (
        <p className="text-sm text-muted">
          {kept.length} exception{kept.length === 1 ? "" : "s"} left for review.
        </p>
      )}
    </div>
  );
}
