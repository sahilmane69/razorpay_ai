import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/Table";
import { displayedRazorpayAmount, formatINR, methodLabel } from "@/lib/format";
import type { ReconciliationResult } from "@/lib/types";

type RecentTransactionsProps = {
  results: ReconciliationResult[];
};

export function RecentTransactions({ results }: RecentTransactionsProps) {
  return (
    <Card className="p-0">
      <div className="px-5 py-4">
        <h2 className="text-base font-semibold text-ink">Recent reconciliation</h2>
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Order</TH>
            <TH>Ledger amount</TH>
            <TH>Razorpay amount</TH>
            <TH>Resolved by</TH>
            <TH>Status</TH>
          </TR>
        </THead>
        <TBody>
          {results.map((result) => {
            const razorpayAmount = displayedRazorpayAmount(result);

            return (
              <TR key={result.orderId}>
                <TD className="font-medium">{result.orderId}</TD>
                <TD>{formatINR(result.ledger.amountExpected)}</TD>
                <TD>{razorpayAmount === null ? "—" : formatINR(razorpayAmount)}</TD>
                <TD>
                  {result.status === "review" ? "—" : methodLabel(result.method)}
                </TD>
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
    </Card>
  );
}
