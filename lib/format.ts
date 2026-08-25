import type { ExceptionType, MatchMethod, ReconciliationResult } from "./types";

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
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
      return "Split payment";
    case "ai_assisted":
      return "AI assisted";
    case "unresolved":
      return "Needs review";
  }
}

export function exceptionLabel(type: ExceptionType): string {
  switch (type) {
    case "amount_mismatch":
      return "Amount mismatch";
    case "missing_settlement":
      return "Missing settlement";
    case "duplicate_payment":
      return "Duplicate payment";
    case "ambiguous_match":
      return "Ambiguous match";
  }
}

export function formatConfidence(value?: number): string {
  if (value === undefined) return "—";
  return `${value}%`;
}

export function displayedRazorpayAmount(result: ReconciliationResult): number | null {
  if (result.razorpayRecords.length === 0) return null;

  const useSettled = result.method === "fee_adjusted";
  return result.razorpayRecords.reduce(
    (sum, record) => sum + (useSettled ? record.amountSettled : record.amountGross),
    0
  );
}
