import type { ReconciliationResult } from "@/lib/types";

export const RECONCILE_STAGES = [
  "Reading ledger",
  "Syncing Razorpay",
  "Matching exact transactions",
  "Checking fees",
  "Checking split settlements",
  "Reviewing difficult matches",
  "Generating report",
] as const;

export function exportResults(
  format: "csv" | "json",
  results: ReconciliationResult[]
) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `reconflow-report-${timestamp}.${format}`;

  let contents: string;
  let mimeType: string;

  if (format === "json") {
    contents = JSON.stringify(results, null, 2);
    mimeType = "application/json";
  } else {
    const header = [
      "order_id",
      "customer",
      "ledger_amount_paise",
      "razorpay_amount_paise",
      "method",
      "confidence",
      "status",
      "reason",
    ];
    const rows = results.map((result) => {
      const razorpayAmount = result.razorpayRecords.reduce(
        (sum, record) => sum + record.amountSettled,
        0
      );
      return [
        result.orderId,
        result.ledger.customer,
        String(result.ledger.amountExpected),
        result.razorpayRecords.length ? String(razorpayAmount) : "",
        result.method,
        result.confidence === undefined ? "" : String(result.confidence),
        result.status,
        `"${result.reason.replace(/"/g, '""')}"`,
      ].join(",");
    });
    contents = [header.join(","), ...rows].join("\n");
    mimeType = "text/csv";
  }

  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
