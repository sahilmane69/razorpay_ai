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

function normalizeGroqDecision(raw: any): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null) return raw;

  if (raw.decision) return raw;

  if (raw.status === "unresolved" || raw.unresolved === true || raw.resolved === false) {
    return {
      decision: "unresolved",
      razorpayRecordIds: [],
      confidence: 0,
      reason: typeof raw.reason === "string" ? raw.reason : "AI could not determine a confident match.",
    };
  }

  if (raw.match) {
    const ids = Array.isArray(raw.match)
      ? raw.match
      : typeof raw.match === "string"
        ? [raw.match]
        : typeof raw.candidateId === "string"
          ? [raw.candidateId]
          : [];

    return {
      decision: ids.length > 0 ? "match" : "unresolved",
      razorpayRecordIds: ids,
      confidence: typeof raw.confidence === "number" ? raw.confidence : 0.9,
      reason: typeof raw.reason === "string" ? raw.reason : "AI identified the strongest candidate match.",
    };
  }

  return raw;
}

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
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        temperature: 0,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: `You are a financial reconciliation assistant.

You receive one ledger record and up to 5 candidate Razorpay records.

You MUST return ONLY one JSON object using exactly this schema:

{
  "decision": "match" | "unresolved",
  "razorpayRecordIds": ["candidate-id"],
  "confidence": 0.0 to 1.0,
  "reason": "short explanation"
}

Rules:

- Do not return any other keys.
- Do not return "status".
- Do not return "match".
- Do not return "matched".
- Do not return "unresolved": true.
- Do not return "candidateId".
- Do not return "matches".
- Always include all four keys:
  decision
  razorpayRecordIds
  confidence
  reason

If unresolved, return:

{
  "decision": "unresolved",
  "razorpayRecordIds": [],
  "confidence": 0.0,
  "reason": "explanation"
}

If matched, razorpayRecordIds must contain only IDs from the provided candidates.

Never invent IDs.
Never invent amounts, dates, fees, or settlements.
Prefer unresolved when evidence is weak.`,
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
              requiredOutput: {
                decision: "match | unresolved",
                razorpayRecordIds: ["candidate-id"],
                confidence: "number between 0 and 1",
                reason: "short explanation",
              },
            }),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content ?? undefined;
      if (!content) {
        throw new Error("Groq returned empty response");
      }
      console.log("[AI] Raw Groq response:", content);

      const parsedRaw = JSON.parse(content);
      const normalized = normalizeGroqDecision(parsedRaw);
      decision = aiDecisionSchema.parse(normalized);
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
