import { formatINR } from "@/lib/money";
import { sameReference, selectCandidates } from "./candidateSelector";
import type {
  MatchResult,
  NormalizedLedgerRecord,
  NormalizedRazorpayRecord,
  ProposedException,
} from "./types";

function daysBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

export function classifyExceptions(
  ledgers: NormalizedLedgerRecord[],
  razorpayRecords: NormalizedRazorpayRecord[],
  usedIds: Set<string>
): {
  remainingForAi: NormalizedLedgerRecord[];
  exceptions: ProposedException[];
  resolvedAsReview: MatchResult[];
} {
  const remainingForAi: NormalizedLedgerRecord[] = [];
  const exceptions: ProposedException[] = [];
  const resolvedAsReview: MatchResult[] = [];

  for (const ledger of ledgers) {
    const unused = razorpayRecords.filter((record) => !usedIds.has(record.id));
    const sameOrder = unused.filter((record) => sameReference(ledger, record));
    const candidates = selectCandidates(ledger, razorpayRecords, usedIds);

    if (sameOrder.length >= 2 && sameOrder.every((record) => record.grossAmountPaise === ledger.amountPaise)) {
      const review: MatchResult = {
        ledger,
        razorpayRecords: sameOrder.slice(0, 2),
        method: "unresolved",
        status: "review",
        reason:
          "Two Razorpay payments were captured for the same order amount. This needs a manual check before it can be closed.",
      };
      resolvedAsReview.push(review);
      exceptions.push({
        ledger,
        type: "DUPLICATE_PAYMENT",
        reason: review.reason,
        closest: sameOrder[0],
      });
      continue;
    }

    if (sameOrder.length === 1 && sameOrder[0].grossAmountPaise !== ledger.amountPaise) {
      const record = sameOrder[0];
      const review: MatchResult = {
        ledger,
        razorpayRecords: [record],
        method: "unresolved",
        status: "review",
        reason: `The Razorpay payment for this order is ${formatINR(record.grossAmountPaise)}, which does not match the ledger amount of ${formatINR(ledger.amountPaise)}.`,
      };
      resolvedAsReview.push(review);
      exceptions.push({
        ledger,
        type: "AMOUNT_MISMATCH",
        reason:
          "The Razorpay payment for this order does not match the expected ledger amount, and the difference is not explained by fees or tax.",
        closest: record,
      });
      continue;
    }

    if (
      sameOrder.length === 1 &&
      sameOrder[0].grossAmountPaise === ledger.amountPaise &&
      daysBetween(ledger.date, sameOrder[0].date) > 7
    ) {
      const record = sameOrder[0];
      const review: MatchResult = {
        ledger,
        razorpayRecords: [record],
        method: "unresolved",
        status: "review",
        reason: "A payment with the same order ID and amount was found, but the dates are too far apart to close automatically.",
      };
      resolvedAsReview.push(review);
      exceptions.push({
        ledger,
        type: "DATE_MISMATCH",
        reason: review.reason,
        closest: record,
      });
      continue;
    }

    if (candidates.length === 0) {
      const review: MatchResult = {
        ledger,
        razorpayRecords: [],
        method: "unresolved",
        status: "review",
        reason: "This order is in the ledger, but no matching Razorpay payment or settlement was found.",
      };
      resolvedAsReview.push(review);
      exceptions.push({
        ledger,
        type: "MISSING_RAZORPAY_RECORD",
        reason: review.reason,
      });
      continue;
    }

    remainingForAi.push(ledger);
  }

  return { remainingForAi, exceptions, resolvedAsReview };
}
