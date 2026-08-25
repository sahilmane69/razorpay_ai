import { MATCH_CONSTANTS, type NormalizedLedgerRecord, type NormalizedRazorpayRecord } from "./types";

function daysBetween(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

export function sameReference(
  ledger: NormalizedLedgerRecord,
  razorpay: NormalizedRazorpayRecord
) {
  if (!razorpay.orderId) return false;
  return razorpay.orderId.trim().toLowerCase() === ledger.orderId.trim().toLowerCase();
}

export function selectCandidates(
  ledger: NormalizedLedgerRecord,
  razorpayRecords: NormalizedRazorpayRecord[],
  usedIds: Set<string>,
  limit = MATCH_CONSTANTS.maxAiCandidates
): NormalizedRazorpayRecord[] {
  const scored = razorpayRecords
    .filter((record) => !usedIds.has(record.id))
    .map((record) => {
      let score = 0;
      if (sameReference(ledger, record)) score += 100;
      if (record.grossAmountPaise === ledger.amountPaise) score += 40;
      if (record.netAmountPaise === ledger.amountPaise) score += 25;
      const amountDelta = Math.abs(record.grossAmountPaise - ledger.amountPaise);
      if (amountDelta <= 2500) score += 15;
      const dayDelta = daysBetween(ledger.date, record.date);
      if (dayDelta <= MATCH_CONSTANTS.dateWindowDays) score += 20 - dayDelta;
      if (dayDelta > MATCH_CONSTANTS.dateWindowDays) score -= 30;
      return { record, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.record);
}
