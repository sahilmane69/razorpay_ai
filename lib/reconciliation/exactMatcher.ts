import { sameReference } from "./candidateSelector";
import { MATCH_CONSTANTS, type MatchResult, type NormalizedLedgerRecord, type NormalizedRazorpayRecord } from "./types";

function withinDateWindow(
  ledger: NormalizedLedgerRecord,
  record: NormalizedRazorpayRecord
) {
  const days = Math.abs(ledger.date.getTime() - record.date.getTime()) / (1000 * 60 * 60 * 24);
  return days <= MATCH_CONSTANTS.dateWindowDays;
}

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
        record.feePaise + record.taxPaise === 0 &&
        withinDateWindow(ledger, record)
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
