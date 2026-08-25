import { formatDate, formatINR } from "@/lib/format";
import type { ReconciliationResult } from "@/lib/types";

type TransactionDetailsProps = {
  result: ReconciliationResult;
};

export function TransactionDetails({ result }: TransactionDetailsProps) {
  const razorpayTotal = result.razorpayRecords.reduce(
    (sum, record) => sum + record.amountSettled,
    0
  );

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-ink">Ledger record</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Order ID" value={result.ledger.orderId} />
          <Row label="Customer" value={result.ledger.customer} />
          <Row label="Amount" value={formatINR(result.ledger.amountExpected)} />
          <Row label="Date" value={formatDate(result.ledger.date)} />
        </dl>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-ink">Razorpay record</h3>
        {result.razorpayRecords.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No matching Razorpay payment found.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {result.razorpayRecords.map((record) => (
              <dl key={record.paymentId} className="space-y-2 rounded-[12px] bg-warm p-3 text-sm">
                <Row label="Payment ID" value={record.paymentId} />
                <Row label="Settlement ID" value={record.settlementId ?? "—"} />
                <Row label="Gross amount" value={formatINR(record.amountGross)} />
                <Row label="Fee" value={formatINR(record.fee)} />
                <Row label="Net settlement" value={formatINR(record.amountSettled)} />
                <Row label="Date" value={formatDate(record.date)} />
              </dl>
            ))}
            {result.razorpayRecords.length > 1 && (
              <p className="text-sm text-muted">
                Combined settlement: {formatINR(razorpayTotal)}
              </p>
            )}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-ink">Resolution</h3>
        <p className="mt-3 text-sm font-medium text-ink">
          {result.method === "exact" && "Exact match"}
          {result.method === "fee_adjusted" && "Fee-adjusted match"}
          {result.method === "split" && "Split payment"}
          {result.method === "ai_assisted" && "AI-assisted match"}
          {result.method === "unresolved" && "Needs review"}
        </p>
        {result.method === "ai_assisted" && result.confidence !== undefined && (
          <p className="mt-1 text-sm text-muted">Confidence: {result.confidence}%</p>
        )}
        <p className="mt-2 text-sm leading-6 text-muted">
          <span className="font-medium text-ink">Reason: </span>
          {result.reason}
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
