import { formatINR } from "@/lib/money";
import { sameReference } from "./candidateSelector";
import type { MatchResult, NormalizedLedgerRecord, NormalizedRazorpayRecord } from "./types";

export function feeMatcher(
  ledgers: NormalizedLedgerRecord[],
  razorpayRecords: NormalizedRazorpayRecord[],
  usedIds: Set<string>
): { matches: MatchResult[]; remaining: NormalizedLedgerRecord[] } {
  const matches: MatchResult[] = [];
  const remaining: NormalizedLedgerRecord[] = [];

  for (const ledger of ledgers) {
    const candidates = razorpayRecords.filter((record) => {
      if (usedIds.has(record.id) || !sameReference(ledger, record)) return false;
      if (record.grossAmountPaise !== ledger.amountPaise) return false;
      const charges = record.feePaise + record.taxPaise;
      if (charges <= 0) return false;
      return record.netAmountPaise === record.grossAmountPaise - charges;
    });

    if (candidates.length === 1) {
      const record = candidates[0];
      usedIds.add(record.id);
      const charges = record.feePaise + record.taxPaise;
      matches.push({
        ledger,
        razorpayRecords: [record],
        method: "fee_adjusted",
        confidence: 1,
        status: "matched",
        reason: `Ledger expected ${formatINR(ledger.amountPaise)}. Razorpay recorded ${formatINR(record.grossAmountPaise)} gross and ${formatINR(record.netAmountPaise)} net after ${formatINR(charges)} in fees and taxes.`,
      });
      continue;
    }

    remaining.push(ledger);
  }

  return { matches, remaining };
}
