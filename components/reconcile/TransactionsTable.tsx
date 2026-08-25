"use client";

import { TransactionDetails } from "@/components/reconcile/TransactionDetails";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { Tabs } from "@/components/ui/Tabs";
import {
  displayedRazorpayAmount,
  formatConfidence,
  formatINR,
  methodLabel,
} from "@/lib/format";
import type { ReconciliationResult } from "@/lib/types";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";

type FilterTab = "all" | "matched" | "ai" | "review";

type TransactionsTableProps = {
  results: ReconciliationResult[];
};

export function TransactionsTable({ results }: TransactionsTableProps) {
  const [tab, setTab] = useState<FilterTab>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = results.find((result) => result.orderId === selectedId) ?? null;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return results.filter((result) => {
      if (tab === "matched" && result.status !== "matched") return false;
      if (tab === "ai" && result.method !== "ai_assisted") return false;
      if (tab === "review" && result.status !== "review") return false;

      if (!normalized) return true;

      const paymentIds = result.razorpayRecords
        .map((record) => record.paymentId.toLowerCase())
        .join(" ");

      return (
        result.orderId.toLowerCase().includes(normalized) ||
        paymentIds.includes(normalized)
      );
    });
  }, [query, results, tab]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          tabs={[
            { id: "all", label: "All" },
            { id: "matched", label: "Matched" },
            { id: "ai", label: "AI assisted" },
            { id: "review", label: "Needs review" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlass
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search order or payment ID"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[12px] border border-line bg-surface">
        <Table>
          <THead>
            <TR>
              <TH>Order ID</TH>
              <TH>Ledger</TH>
              <TH>Razorpay</TH>
              <TH>Method</TH>
              <TH>Confidence</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((result) => {
              const razorpayAmount = displayedRazorpayAmount(result);

              return (
                <TR
                  key={result.orderId}
                  onClick={() => setSelectedId(result.orderId)}
                  className="cursor-pointer hover:bg-warm"
                >
                  <TD className="font-medium">{result.orderId}</TD>
                  <TD>{formatINR(result.ledger.amountExpected)}</TD>
                  <TD>{razorpayAmount === null ? "—" : formatINR(razorpayAmount)}</TD>
                  <TD>{methodLabel(result.method)}</TD>
                  <TD>{formatConfidence(result.confidence)}</TD>
                  <TD>
                    <Badge tone={result.status === "matched" ? "matched" : "review"}>
                      {result.status === "matched" ? "Matched" : "Review"}
                    </Badge>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted">
            No transactions match this filter.
          </p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-ink/20"
            aria-label="Close details"
            onClick={() => setSelectedId(null)}
          />
          <aside className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-surface p-6 shadow-[-8px_0_24px_rgba(28,25,23,0.06)]">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm text-muted">Transaction</p>
                <h2 className="mt-1 text-lg font-semibold text-ink">
                  {selected.orderId}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-[10px] p-1 text-muted hover:bg-warm hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <TransactionDetails result={selected} />
          </aside>
        </div>
      )}
    </div>
  );
}
