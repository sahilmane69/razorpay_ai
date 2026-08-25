"use client";

import { ExceptionCard } from "@/components/reconcile/ExceptionCard";
import type { ExceptionItem } from "@/lib/types";
import { useState } from "react";

type ExceptionsListProps = {
  exceptions: ExceptionItem[];
};

export function ExceptionsList({ exceptions }: ExceptionsListProps) {
  const [resolved, setResolved] = useState<string[]>(
    exceptions.filter((item) => item.status === "RESOLVED").map((item) => item.id ?? item.orderId)
  );
  const [kept, setKept] = useState<string[]>([]);

  async function resolve(item: ExceptionItem) {
    const key = item.id ?? item.orderId;
    if (item.id) {
      const response = await fetch(`/api/exceptions/${item.id}/resolve`, { method: "POST" });
      if (!response.ok) return;
    }
    setResolved((current) => (current.includes(key) ? current : [...current, key]));
  }

  return (
    <div className="space-y-3">
      {exceptions.length === 0 ? (
        <p className="text-sm text-muted">No exceptions for this run.</p>
      ) : (
        exceptions.map((item) => {
          const key = item.id ?? item.orderId;
          return (
            <ExceptionCard
              key={key}
              item={item}
              resolved={resolved.includes(key)}
              onResolve={() => void resolve(item)}
              onLeave={() =>
                setKept((current) => (current.includes(key) ? current : [...current, key]))
              }
            />
          );
        })
      )}
      {kept.length > 0 && (
        <p className="text-sm text-muted">
          {kept.length} exception{kept.length === 1 ? "" : "s"} left for review.
        </p>
      )}
    </div>
  );
}
