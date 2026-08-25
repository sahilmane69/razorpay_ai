import { formatINR } from "@/lib/money";
import { sameReference, selectCandidates } from "./candidateSelector";
import { MATCH_CONSTANTS, type MatchResult, type NormalizedLedgerRecord, type NormalizedRazorpayRecord } from "./types";

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const result: T[][] = [];
  const walk = (start: number, chosen: T[]) => {
    if (chosen.length === size) {
      result.push([...chosen]);
      return;
    }
    for (let i = start; i < items.length; i += 1) {
      chosen.push(items[i]);
      walk(i + 1, chosen);
      chosen.pop();
    }
  };
  walk(0, []);
  return result;
}

export function splitMatcher(
  ledgers: NormalizedLedgerRecord[],
  razorpayRecords: NormalizedRazorpayRecord[],
  usedIds: Set<string>
): { matches: MatchResult[]; remaining: NormalizedLedgerRecord[] } {
  const matches: MatchResult[] = [];
  const remaining: NormalizedLedgerRecord[] = [];

  for (const ledger of ledgers) {
    const related = razorpayRecords.filter(
      (record) => !usedIds.has(record.id) && sameReference(ledger, record)
    );
    const pool =
      related.length >= 2
        ? related.slice(0, MATCH_CONSTANTS.maxSplitCandidates)
        : selectCandidates(
            ledger,
            razorpayRecords,
            usedIds,
            MATCH_CONSTANTS.maxSplitCandidates
          ).filter((record) => record.grossAmountPaise < ledger.amountPaise);

    let found: NormalizedRazorpayRecord[] | null = null;

    for (let size = 2; size <= MATCH_CONSTANTS.maxSplitParts && !found; size += 1) {
      for (const combo of combinations(pool, size)) {
        const gross = combo.reduce((sum, record) => sum + record.grossAmountPaise, 0);
        if (gross === ledger.amountPaise) {
          found = combo;
          break;
        }
      }
    }

    if (found) {
      found.forEach((record) => usedIds.add(record.id));
      matches.push({
        ledger,
        razorpayRecords: found,
        method: "split",
        confidence: 1,
        status: "matched",
        reason: `${found.length} Razorpay payments add up to the ledger amount of ${formatINR(ledger.amountPaise)}.`,
      });
      continue;
    }

    remaining.push(ledger);
  }

  return { matches, remaining };
}
