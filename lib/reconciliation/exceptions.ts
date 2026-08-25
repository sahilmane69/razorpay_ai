import { formatINR } from "@/lib/money";
import type { UnresolvedItem } from "./aiMatcher";
import { sameReference } from "./candidateSelector";
import type {
  ExceptionType,
  MatchResult,
  NormalizedRazorpayRecord,
  ProposedException,
} from "./types";

function daysBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

export function classifyExceptions(
  unresolvedItems: UnresolvedItem[],
  razorpayRecords: NormalizedRazorpayRecord[],
  usedIds: Set<string>
): {
  exceptions: ProposedException[];
  resolvedAsReview: MatchResult[];
} {
  const exceptions: ProposedException[] = [];
  const resolvedAsReview: MatchResult[] = [];

  for (const item of unresolvedItems) {
    const { ledger, aiDecision, candidates } = item;
    const unused = razorpayRecords.filter((record) => !usedIds.has(record.id));
    const sameOrder = unused.filter((record) => sameReference(ledger, record));

    if (sameOrder.length >= 2 && sameOrder.every((record) => record.grossAmountPaise === ledger.amountPaise)) {
      const reason =
        aiDecision?.reason ||
        "Two Razorpay payments were captured for the same order amount. This needs a manual check before it can be closed.";
      const review: MatchResult = {
        ledger,
        razorpayRecords: sameOrder.slice(0, 2),
        method: "unresolved",
        status: "review",
        reason,
      };
      resolvedAsReview.push(review);
      exceptions.push({
        ledger,
        type: "DUPLICATE_PAYMENT",
        reason,
        closest: sameOrder[0],
      });
      continue;
    }

    if (sameOrder.length === 1 && sameOrder[0].grossAmountPaise !== ledger.amountPaise) {
      const record = sameOrder[0];
      const reason =
        aiDecision?.reason ||
        `The Razorpay payment for this order is ${formatINR(record.grossAmountPaise)}, which does not match the ledger amount of ${formatINR(ledger.amountPaise)}.`;
      const review: MatchResult = {
        ledger,
        razorpayRecords: [record],
        method: "unresolved",
        status: "review",
        reason,
      };
      resolvedAsReview.push(review);
      exceptions.push({
        ledger,
        type: "AMOUNT_MISMATCH",
        reason:
          aiDecision?.reason ||
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
      const reason =
        aiDecision?.reason ||
        "A payment with the same order ID and amount was found, but the dates are too far apart to close automatically.";
      const review: MatchResult = {
        ledger,
        razorpayRecords: [record],
        method: "unresolved",
        status: "review",
        reason,
      };
      resolvedAsReview.push(review);
      exceptions.push({
        ledger,
        type: "DATE_MISMATCH",
        reason,
        closest: record,
      });
      continue;
    }

    if (candidates.length === 0) {
      const reason =
        aiDecision?.reason ||
        "This order is in the ledger, but no matching Razorpay payment or settlement was found.";
      const review: MatchResult = {
        ledger,
        razorpayRecords: [],
        method: "unresolved",
        status: "review",
        reason,
      };
      resolvedAsReview.push(review);
      exceptions.push({
        ledger,
        type: "MISSING_RAZORPAY_RECORD",
        reason,
      });
      continue;
    }

    const isLowConfidence = aiDecision?.decision === "match" && aiDecision.confidence < 0.85;
    const exceptionType: ExceptionType = isLowConfidence
      ? "AI_LOW_CONFIDENCE"
      : "AMBIGUOUS_MATCH";

    const defaultReason =
      candidates.length > 1
        ? "Two Razorpay payments are plausible matches for this ledger entry, but neither has enough evidence to resolve automatically."
        : isLowConfidence
          ? "A possible match was found, but there is not enough confidence to close it automatically."
          : "No automatic match could be determined.";

    const finalReason = aiDecision?.reason && aiDecision.reason.length > 0 ? aiDecision.reason : defaultReason;

    const chosenCandidates =
      aiDecision?.razorpayRecordIds && aiDecision.razorpayRecordIds.length > 0
        ? candidates.filter((c) => aiDecision.razorpayRecordIds.includes(c.id))
        : candidates.slice(0, 1);

    const review: MatchResult = {
      ledger,
      razorpayRecords: chosenCandidates.length > 0 ? chosenCandidates : candidates.slice(0, 1),
      method: "unresolved",
      status: "review",
      reason: finalReason,
    };

    resolvedAsReview.push(review);
    exceptions.push({
      ledger,
      type: exceptionType,
      reason: finalReason,
      closest: chosenCandidates[0] ?? candidates[0],
    });
  }

  return { exceptions, resolvedAsReview };
}
