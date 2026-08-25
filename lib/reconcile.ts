import { EXCEPTIONS, RESULTS } from "./mock-data";
import type { LedgerUpload, ReconciliationResult } from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const RECONCILE_STAGES = [
  "Reading ledger",
  "Fetching Razorpay transactions",
  "Exact matching",
  "Checking fees and split settlements",
  "Reviewing ambiguous records",
  "Creating report",
] as const;

export async function parseLedgerCsv(file: File): Promise<LedgerUpload> {
  await delay(250);
  const text = await file.text();
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const rowCount = Math.max(rows.length - 1, 0);

  return {
    fileName: file.name,
    rowCount: rowCount > 0 ? rowCount : 50,
  };
}

export function sampleLedger(): LedgerUpload {
  return {
    fileName: "august-ledger.csv",
    rowCount: 50,
  };
}

export async function fetchRazorpayTransactions(): Promise<void> {
  await delay(400);
}

export async function runReconciliation(
  onStage: (index: number, label: string) => void
): Promise<{ results: ReconciliationResult[]; exceptionCount: number }> {
  for (let index = 0; index < RECONCILE_STAGES.length; index += 1) {
    onStage(index, RECONCILE_STAGES[index]);
    await delay(520);
  }

  return {
    results: RESULTS,
    exceptionCount: EXCEPTIONS.length,
  };
}

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
      "ledger_amount",
      "razorpay_amount",
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
