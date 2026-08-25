import { aiMatcher } from "./aiMatcher";
import { evaluate, type EvaluationMetrics } from "./evaluate";
import { exactMatcher } from "./exactMatcher";
import { classifyExceptions } from "./exceptions";
import { feeMatcher } from "./feeMatcher";
import { splitMatcher } from "./splitMatcher";
import type {
  MatchResult,
  NormalizedLedgerRecord,
  NormalizedRazorpayRecord,
  ProposedException,
  ReconciliationOutput,
} from "./types";

export async function reconcile(
  ledgers: NormalizedLedgerRecord[],
  razorpayRecords: NormalizedRazorpayRecord[]
): Promise<ReconciliationOutput & { evaluation: EvaluationMetrics | null; processingTimeMs: number }> {
  const started = Date.now();
  const usedIds = new Set<string>();
  const allMatches: MatchResult[] = [];
  const allExceptions: ProposedException[] = [];

  // 1. Exact Matcher
  const exact = exactMatcher(ledgers, razorpayRecords, usedIds);
  allMatches.push(...exact.matches);

  // 2. Fee Matcher
  const fee = feeMatcher(exact.remaining, razorpayRecords, usedIds);
  allMatches.push(...fee.matches);

  // 3. Split Matcher
  const split = splitMatcher(fee.remaining, razorpayRecords, usedIds);
  allMatches.push(...split.matches);

  // 4. Groq AI Matcher (evaluates all remaining unmatched ledger records)
  const ai = await aiMatcher(split.remaining, razorpayRecords, usedIds);
  allMatches.push(...ai.matches);

  // 5. Finalize unresolved exceptions after AI pass
  const classified = classifyExceptions(ai.unresolved, razorpayRecords, usedIds);
  allMatches.push(...classified.resolvedAsReview);
  allExceptions.push(...classified.exceptions);

  const processingTimeMs = Date.now() - started;
  const evaluation = evaluate(allMatches, allExceptions.length, processingTimeMs);

  return {
    matches: allMatches,
    exceptions: allExceptions,
    evaluation,
    processingTimeMs,
  };
}
