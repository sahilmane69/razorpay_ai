import "server-only";

import { formatINR } from "@/lib/money";
import OpenAI from "openai";
import { z } from "zod";
import { selectCandidates } from "./candidateSelector";
import { MATCH_CONSTANTS, type AIMatchDecision, type MatchResult, type NormalizedLedgerRecord, type NormalizedRazorpayRecord, type ProposedException } from "./types";

const DecisionSchema = z.object({
  ledgerRecordId: z.string().min(1),
  razorpayRecordIds: z.array(z.string().min(1)),
  decision: z.enum(["match", "unresolved"]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(600),
});

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function toPromptRecord(record: NormalizedRazorpayRecord) {
  return {
    id: record.id,
    paymentId: record.paymentId ?? null,
    orderId: record.orderId ?? null,
    settlementId: record.settlementId ?? null,
    gross: formatINR(record.grossAmountPaise),
    fee: formatINR(record.feePaise),
    tax: formatINR(record.taxPaise),
    net: formatINR(record.netAmountPaise),
    date: record.date.toISOString().slice(0, 10),
  };
}

export async function aiMatcher(
  ledgers: NormalizedLedgerRecord[],
  razorpayRecords: NormalizedRazorpayRecord[],
  usedIds: Set<string>
): Promise<{ matches: MatchResult[]; reviews: MatchResult[]; exceptions: ProposedException[] }> {
  const matches: MatchResult[] = [];
  const reviews: MatchResult[] = [];
  const exceptions: ProposedException[] = [];

  for (const ledger of ledgers) {
    const candidates = selectCandidates(ledger, razorpayRecords, usedIds);
    if (candidates.length === 0) {
      reviews.push({
        ledger,
        razorpayRecords: [],
        method: "unresolved",
        status: "review",
        reason: "This order is in the ledger, but no matching Razorpay payment or settlement was found.",
      });
      exceptions.push({
        ledger,
        type: "MISSING_RAZORPAY_RECORD",
        reason: "This order is in the ledger, but no matching Razorpay payment or settlement was found.",
      });
      continue;
    }

    const decision = await decide(ledger, candidates);
    const chosen = candidates.filter((record) => decision.razorpayRecordIds.includes(record.id));

    if (
      decision.decision === "match" &&
      decision.confidence >= MATCH_CONSTANTS.aiAcceptConfidence &&
      chosen.length > 0
    ) {
      chosen.forEach((record) => usedIds.add(record.id));
      matches.push({
        ledger,
        razorpayRecords: chosen,
        method: "ai_assisted",
        confidence: decision.confidence,
        status: "matched",
        reason: decision.reason,
      });
      continue;
    }

    const reviewReason =
      decision.confidence < MATCH_CONSTANTS.aiAcceptConfidence && decision.decision === "match"
        ? "A possible match was found, but there is not enough confidence to close it automatically."
        : decision.reason;

    reviews.push({
      ledger,
      razorpayRecords: chosen.length > 0 ? chosen : candidates.slice(0, 1),
      method: "unresolved",
      status: "review",
      reason: reviewReason,
    });
    exceptions.push({
      ledger,
      type:
        decision.decision === "match" && decision.confidence < MATCH_CONSTANTS.aiAcceptConfidence
          ? "AI_LOW_CONFIDENCE"
          : candidates.length > 1
            ? "AMBIGUOUS_MATCH"
            : "AMBIGUOUS_MATCH",
      reason:
        candidates.length > 1
          ? "Two Razorpay payments are plausible matches for this ledger entry, but neither has enough evidence to resolve automatically."
          : reviewReason,
      closest: (chosen[0] ?? candidates[0]),
    });
  }

  return { matches, reviews, exceptions };
}

async function decide(
  ledger: NormalizedLedgerRecord,
  candidates: NormalizedRazorpayRecord[]
): Promise<AIMatchDecision> {
  const fallback: AIMatchDecision = {
    ledgerRecordId: ledger.id,
    razorpayRecordIds: [],
    decision: "unresolved",
    confidence: 0,
    reason:
      "Two Razorpay payments are plausible matches for this ledger entry, but neither has enough evidence to resolve automatically.",
  };

  if (!openai) return fallback;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You assist with financial reconciliation.\n\nOnly evaluate the records provided.\n\nNever invent payments, identifiers, amounts, fees, dates, or settlement records.\n\nPrefer unresolved over an uncertain match.\n\nA financial record must not be automatically matched unless evidence is sufficiently strong.\n\nReturn only the required structured result as JSON with keys ledgerRecordId, razorpayRecordIds, decision, confidence, reason.",
        },
        {
          role: "user",
          content: JSON.stringify({
            ledger: {
              id: ledger.id,
              orderId: ledger.orderId,
              amount: formatINR(ledger.amountPaise),
              date: ledger.date.toISOString().slice(0, 10),
            },
            candidates: candidates.map(toPromptRecord),
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallback;
    const parsed = DecisionSchema.parse(JSON.parse(raw));
    const allowed = new Set(candidates.map((record) => record.id));
    return {
      ...parsed,
      ledgerRecordId: ledger.id,
      razorpayRecordIds: parsed.razorpayRecordIds.filter((id) => allowed.has(id)),
    };
  } catch (error) {
    console.error("AI matcher failed", error);
    return fallback;
  }
}
