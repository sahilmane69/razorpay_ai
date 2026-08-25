import "server-only";

import { formatINR } from "@/lib/money";
import Groq from "groq-sdk";
import { z } from "zod";
import { selectCandidates } from "./candidateSelector";
import {
  MATCH_CONSTANTS,
  type MatchResult,
  type NormalizedLedgerRecord,
  type NormalizedRazorpayRecord,
} from "./types";

const aiDecisionSchema = z.object({
  decision: z.enum(["match", "unresolved"]),
  razorpayRecordIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
});

export type AIMatchDecision = z.infer<typeof aiDecisionSchema>;

export type UnresolvedItem = {
  ledger: NormalizedLedgerRecord;
  aiDecision?: AIMatchDecision | null;
  candidates: NormalizedRazorpayRecord[];
};

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
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
): Promise<{
  matches: MatchResult[];
  unresolved: UnresolvedItem[];
}> {
  if (!process.env.GROQ_API_KEY || !groq) {
    console.error("[AI] GROQ_API_KEY is missing");
  }

  const matches: MatchResult[] = [];
  const unresolved: UnresolvedItem[] = [];

  let reviewedCount = 0;
  let acceptedCount = 0;
  let unresolvedCount = 0;
  let failedCount = 0;

  for (const ledger of ledgers) {
    const candidates = selectCandidates(ledger, razorpayRecords, usedIds, MATCH_CONSTANTS.maxAiCandidates);

    if (candidates.length === 0) {
      unresolved.push({ ledger, aiDecision: null, candidates: [] });
      unresolvedCount++;
      continue;
    }

    reviewedCount++;
    console.log(`[AI] Ledger: ${ledger.orderId}`);
    console.log(`[AI] Candidates: ${candidates.length}`);

    if (!groq) {
      unresolved.push({ ledger, aiDecision: null, candidates });
      unresolvedCount++;
      failedCount++;
      continue;
    }

    let decision: AIMatchDecision | null = null;

    try {
      console.log("[AI] Calling Groq");
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: `
You are a financial reconciliation assistant.

You receive one merchant ledger record and a small set of possible Razorpay records.

Your task is to decide whether one or more candidate Razorpay records plausibly correspond to the ledger record.

Rules:
- Never invent records.
- Never invent IDs.
- Never modify amounts.
- Never fabricate fees, dates, or settlements.
- Use only the supplied candidates.
- Prefer unresolved if evidence is weak.
- A different order ID is not automatically wrong if amount, date and other evidence strongly support the match.
- A large date gap should reduce confidence.
- Duplicate or equally plausible candidates should normally remain unresolved.
- Return valid JSON only.
            `,
          },
          {
            role: "user",
            content: JSON.stringify({
              ledger: {
                id: ledger.id,
                orderId: ledger.orderId,
                customer: ledger.customer ?? null,
                amount: formatINR(ledger.amountPaise),
                date: ledger.date.toISOString().slice(0, 10),
              },
              candidates: candidates.map(toPromptRecord),
            }),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content ?? undefined;
      if (!content) {
        throw new Error("Groq returned empty response");
      }
      console.log("[AI] Raw Groq response:", content);

      const parsed = JSON.parse(content);
      decision = aiDecisionSchema.parse(parsed);
      console.log("[AI] Parsed decision:", decision);
    } catch (error) {
      console.error("[AI] Groq error:", error);
      failedCount++;
    }

    const allowedIds = new Set(candidates.map((c) => c.id));
    const validMatchedIds = decision?.razorpayRecordIds.filter((id) => allowedIds.has(id)) ?? [];

    if (
      decision &&
      decision.decision === "match" &&
      decision.confidence >= MATCH_CONSTANTS.aiAcceptConfidence &&
      validMatchedIds.length > 0
    ) {
      const matchedCandidates = candidates.filter((c) => validMatchedIds.includes(c.id));
      matchedCandidates.forEach((c) => usedIds.add(c.id));

      matches.push({
        ledger,
        razorpayRecords: matchedCandidates,
        method: "ai_assisted",
        confidence: decision.confidence,
        status: "matched",
        reason: decision.reason,
      });
      acceptedCount++;
    } else {
      unresolved.push({ ledger, aiDecision: decision, candidates });
      unresolvedCount++;
    }
  }

  console.log(`[AI] Records reviewed: ${reviewedCount}`);
  console.log(`[AI] Accepted matches: ${acceptedCount}`);
  console.log(`[AI] Left unresolved: ${unresolvedCount}`);
  console.log(`[AI] Failed calls: ${failedCount}`);

  return { matches, unresolved };
}
