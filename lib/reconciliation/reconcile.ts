import { aiMatcher } from "./aiMatcher";
import { classifyExceptions } from "./exceptions";
import { evaluate } from "./evaluate";
import { exactMatcher } from "./exactMatcher";
import { feeMatcher } from "./feeMatcher";
import { splitMatcher } from "./splitMatcher";
import type {
  MatchResult,
  NormalizedLedgerRecord,
  NormalizedRazorpayRecord,
  ProposedException,
  ReconciliationOutput,
} from "./types";
import type { EvaluationMetrics } from "./evaluate";

export async function reconcile(
  ledgers: NormalizedLedgerRecord[],
  razorpayRecords: NormalizedRazorpayRecord[]
): Promise<ReconciliationOutput & { evaluation: EvaluationMetrics | null; processingTimeMs: number }> {
  const started = Date.now();
  const usedIds = new Set<string>();
  const allMatches: MatchResult[] = [];
  const allExceptions: ProposedException[] = [];

  const exact = exactMatcher(ledgers, razorpayRecords, usedIds);
  allMatches.push(...exact.matches);

  const fee = feeMatcher(exact.remaining, razorpayRecords, usedIds);
  allMatches.push(...fee.matches);

  const split = splitMatcher(fee.remaining, razorpayRecords, usedIds);
  allMatches.push(...split.matches);

  const classified = classifyExceptions(split.remaining, razorpayRecords, usedIds);
  allMatches.push(...classified.resolvedAsReview);
  allExceptions.push(...classified.exceptions);

  const ai = await aiMatcher(classified.remainingForAi, razorpayRecords, usedIds);
  allMatches.push(...ai.matches, ...ai.reviews);
  allExceptions.push(...ai.exceptions);

  const processingTimeMs = Date.now() - started;
  const evaluation = evaluate(allMatches, allExceptions.length, processingTimeMs);

  return {
    matches: allMatches,
    exceptions: allExceptions,
    evaluation,
    processingTimeMs,
  };
}
