import { formatDate, formatINR, methodLabel } from "@/lib/format";
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
        <h3 className="text-sm font-semibold text-ink">Ledger</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Order ID" value={result.ledger.orderId} />
          {result.ledger.customer ? <Row label="Customer" value={result.ledger.customer} /> : null}
          <Row label="Amount" value={formatINR(result.ledger.amountExpected)} />
          <Row label="Date" value={formatDate(result.ledger.date)} />
        </dl>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-ink">Razorpay</h3>
        {result.razorpayRecords.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No matching Razorpay payment found.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {result.razorpayRecords.map((record) => (
              <dl key={record.paymentId} className="space-y-2 rounded-[12px] bg-warm p-3 text-sm">
                <Row label="Payment ID" value={record.paymentId} />
                <Row label="Settlement ID" value={record.settlementId ?? "—"} />
                <Row label="Gross" value={formatINR(record.amountGross)} />
                <Row label="Fee" value={formatINR(record.fee)} />
                <Row label="Tax" value={formatINR(record.tax ?? 0)} />
                <Row label="Net" value={formatINR(record.amountSettled)} />
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
        <p className="mt-3 text-sm font-medium text-ink">{methodLabel(result.method)}</p>
        {result.method !== "unresolved" && (
          <p className="mt-1 text-sm text-muted">
            Confidence: {result.confidence === undefined ? "100%" : `${Math.round((result.confidence <= 1 ? result.confidence * 100 : result.confidence))}%`}
          </p>
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
