import { sameReference } from "./candidateSelector";
import type { MatchResult, NormalizedLedgerRecord, NormalizedRazorpayRecord } from "./types";

export function exactMatcher(
  ledgers: NormalizedLedgerRecord[],
  razorpayRecords: NormalizedRazorpayRecord[],
  usedIds: Set<string>
): { matches: MatchResult[]; remaining: NormalizedLedgerRecord[] } {
  const matches: MatchResult[] = [];
  const remaining: NormalizedLedgerRecord[] = [];

  for (const ledger of ledgers) {
    const candidates = razorpayRecords.filter(
      (record) =>
        !usedIds.has(record.id) &&
        sameReference(ledger, record) &&
        record.grossAmountPaise === ledger.amountPaise &&
        record.feePaise + record.taxPaise === 0
    );

    if (candidates.length === 1) {
      const record = candidates[0];
      usedIds.add(record.id);
      matches.push({
        ledger,
        razorpayRecords: [record],
        method: "exact",
        confidence: 1,
        status: "matched",
        reason: "Order ID and gross amount match exactly.",
      });
      continue;
    }

    remaining.push(ledger);
  }

  return { matches, remaining };
}
