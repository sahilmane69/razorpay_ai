import { formatINR } from "@/lib/money";
import type { ExceptionType, MatchMethod, ReconciliationResult } from "./types";

export { formatINR };

export function formatDate(isoDate: string): string {
  const date = isoDate.includes("T")
    ? new Date(isoDate)
    : new Date(`${isoDate}T00:00:00`);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function methodLabel(method: MatchMethod): string {
  switch (method) {
    case "exact":
      return "Exact match";
    case "fee_adjusted":
      return "Fee adjusted";
    case "split":
      return "Split settlement";
    case "ai_assisted":
      return "AI assisted";
    case "unresolved":
      return "Needs review";
  }
}

export function exceptionLabel(type: ExceptionType): string {
  switch (type) {
    case "AMOUNT_MISMATCH":
    case "amount_mismatch":
      return "Amount mismatch";
    case "MISSING_RAZORPAY_RECORD":
    case "missing_settlement":
      return "Missing settlement";
    case "DUPLICATE_PAYMENT":
    case "duplicate_payment":
      return "Duplicate payment";
    case "AMBIGUOUS_MATCH":
    case "ambiguous_match":
      return "Ambiguous match";
    case "DATE_MISMATCH":
      return "Date mismatch";
    case "AI_LOW_CONFIDENCE":
      return "Needs more evidence";
    case "INVALID_LEDGER_RECORD":
      return "Invalid ledger record";
  }
}

export function formatConfidence(value?: number): string {
  if (value === undefined || value === null) return "—";
  const percent = value <= 1 ? Math.round(value * 100) : Math.round(value);
  return `${percent}%`;
}

export function displayedRazorpayAmount(result: ReconciliationResult): number | null {
  if (result.razorpayRecords.length === 0) return null;

  const useSettled = result.method === "fee_adjusted";
  return result.razorpayRecords.reduce(
    (sum, record) => sum + (useSettled ? record.amountSettled : record.amountGross),
    0
  );
}

export function percentLabel(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Not available";
  return `${Math.round(value * (value <= 1 ? 100 : 1))}%`;
}
