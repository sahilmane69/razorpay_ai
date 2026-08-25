"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { formatDate } from "@/lib/format";
import type { ReconciliationRun } from "@/lib/types";
import { useRouter } from "next/navigation";

type HistoryTableProps = {
  runs: ReconciliationRun[];
};

export function HistoryTable({ runs }: HistoryTableProps) {
  const router = useRouter();

  return (
    <Card className="p-0">
      <Table>
        <THead>
          <TR>
            <TH>Date</TH>
            <TH>Ledger</TH>
            <TH>Records</TH>
            <TH>Match rate</TH>
            <TH>Exceptions</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {runs.map((run) => (
            <TR
              key={run.id}
              className="cursor-pointer hover:bg-warm"
              onClick={() => router.push(`/history/${run.id}`)}
            >
              <TD className="font-medium">{formatDate(run.date)}</TD>
              <TD>{run.ledgerFile}</TD>
              <TD>{run.records}</TD>
              <TD>{run.matchRate}%</TD>
              <TD>{run.exceptions}</TD>
              <TD>
                <Badge tone="matched">
                  {run.status === "completed" ? "Completed" : "Failed"}
                </Badge>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
