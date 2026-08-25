"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { formatDate, percentLabel } from "@/lib/format";
import type { ReconciliationRun } from "@/lib/types";
import { useRouter } from "next/navigation";

type HistoryTableProps = {
  runs: ReconciliationRun[];
};

export function HistoryTable({ runs }: HistoryTableProps) {
  const router = useRouter();

  if (runs.length === 0) {
    return (
      <Card className="p-8 text-sm text-muted">
        No reconciliations yet. Upload your ledger and run your first reconciliation.
      </Card>
    );
  }

  return (
    <Card className="p-0">
      <Table>
        <THead>
          <TR>
            <TH>Date</TH>
            <TH>Ledger</TH>
            <TH>Records</TH>
            <TH>Match rate</TH>
            <TH>Accuracy</TH>
            <TH>Exceptions</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {runs.map((run) => (
            <TR
              key={run.id}
              className="cursor-pointer hover:bg-warm"
              onClick={() => router.push(`/reconcile/results?run=${run.id}`)}
            >
              <TD className="font-medium">{formatDate(run.date)}</TD>
              <TD>{run.ledgerFile}</TD>
              <TD>{run.records}</TD>
              <TD>{percentLabel(run.matchRate)}</TD>
              <TD>{percentLabel(run.accuracy)}</TD>
              <TD>{run.exceptions}</TD>
              <TD>
                <Badge tone={run.status === "completed" ? "matched" : "review"}>
                  {run.status === "completed"
                    ? "Completed"
                    : run.status === "failed"
                      ? "Failed"
                      : "Processing"}
                </Badge>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
