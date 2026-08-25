import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { MatchResult } from "./types";

export type GroundTruthRecord = {
  orderId: string;
  expectedPaymentIds: string[];
  expectedMethod: string;
  shouldMatch: boolean;
};

export type EvaluationMetrics = {
  totalRecords: number;
  resolvedRecords: number;
  correctMatches: number;
  incorrectMatches: number;
  trueUnresolved: number;
  falseUnresolved: number;
  matchRate: number;
  precision: number;
  recall: number;
  accuracy: number;
  exceptionCount: number;
  processingTimeMs: number;
};

type GroundTruthFile = {
  records: GroundTruthRecord[];
};

function loadGroundTruth(): GroundTruthFile | null {
  try {
    const path = join(process.cwd(), "data/evaluation/ground-truth.json");
    return JSON.parse(readFileSync(path, "utf8")) as GroundTruthFile;
  } catch {
    return null;
  }
}

export function isEvaluationSet(orderIds: string[]): boolean {
  const truth = loadGroundTruth();
  if (!truth) return false;
  const known = new Set(truth.records.map((record) => record.orderId));
  return orderIds.length > 0 && orderIds.every((id) => known.has(id));
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

/**
 * matchRate = resolved / total
 * precision = correct resolved matches / all resolved matches
 * recall = correct resolved matches / records that should have matched
 * accuracy = (correct matches + true unresolved) / total
 * Accuracy is not match rate: it penalizes wrong matches and missed matches.
 */
export function evaluate(
  matches: MatchResult[],
  exceptionCount: number,
  processingTimeMs: number
): EvaluationMetrics | null {
  const truth = loadGroundTruth();
  if (!truth) return null;

  const byOrder = new Map(truth.records.map((record) => [record.orderId, record]));
  if (!matches.every((match) => byOrder.has(match.ledger.orderId))) {
    return null;
  }

  let correctMatches = 0;
  let incorrectMatches = 0;
  let trueUnresolved = 0;
  let falseUnresolved = 0;
  let shouldHaveMatched = 0;

  for (const match of matches) {
    const expected = byOrder.get(match.ledger.orderId);
    if (!expected) continue;
    if (expected.shouldMatch) shouldHaveMatched += 1;

    const actualIds = match.razorpayRecords
      .map((record) => record.paymentId)
      .filter((id): id is string => Boolean(id));

    if (match.status === "matched") {
      if (expected.shouldMatch && sameIds(actualIds, expected.expectedPaymentIds)) {
        correctMatches += 1;
      } else {
        incorrectMatches += 1;
      }
    } else if (expected.shouldMatch) {
      falseUnresolved += 1;
    } else {
      trueUnresolved += 1;
    }
  }

  const totalRecords = matches.length;
  const resolvedRecords = matches.filter((match) => match.status === "matched").length;
  const matchRate = totalRecords === 0 ? 0 : resolvedRecords / totalRecords;
  const precision = resolvedRecords === 0 ? 0 : correctMatches / resolvedRecords;
  const recall = shouldHaveMatched === 0 ? 0 : correctMatches / shouldHaveMatched;
  const accuracy = totalRecords === 0 ? 0 : (correctMatches + trueUnresolved) / totalRecords;

  return {
    totalRecords,
    resolvedRecords,
    correctMatches,
    incorrectMatches,
    trueUnresolved,
    falseUnresolved,
    matchRate,
    precision,
    recall,
    accuracy,
    exceptionCount,
    processingTimeMs,
  };
}
