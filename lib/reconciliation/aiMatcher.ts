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

const aiBatchDecisionSchema = z.object({
  ledgerRecordId: z.string().min(1),
  decision: z.enum(["match", "unresolved"]),
  razorpayRecordIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
});

const aiBatchOutputSchema = z.object({
  decisions: z.array(aiBatchDecisionSchema),
});

export type AIMatchDecision = z.infer<typeof aiBatchDecisionSchema>;

export type UnresolvedItem = {
  ledger: NormalizedLedgerRecord;
  aiDecision?: AIMatchDecision | null;
  candidates: NormalizedRazorpayRecord[];
};

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

function normalizeBatchDecision(raw: any): Record<string, unknown> {
  if (typeof raw !== "object" || raw === null) return raw;

  const ledgerRecordId = String(raw.ledgerRecordId || raw.ledgerId || raw.id || "");
  const rawDecision = String(raw.decision || "").toLowerCase();
  const rawStatus = String(raw.status || "").toLowerCase();

  const isUnresolved =
    rawDecision === "unresolved" ||
    rawStatus === "unresolved" ||
    raw.unresolved === true ||
    raw.resolved === false;

  const isMatch =
    !isUnresolved &&
    (rawDecision === "match" ||
      rawStatus === "match" ||
      rawStatus === "matched" ||
      Boolean(raw.match));

  let razorpayRecordIds: string[] = [];
  if (Array.isArray(raw.razorpayRecordIds)) {
    razorpayRecordIds = raw.razorpayRecordIds.map(String);
  } else if (Array.isArray(raw.match)) {
    razorpayRecordIds = raw.match.map(String);
  } else if (typeof raw.match === "string") {
    razorpayRecordIds = [raw.match];
  } else if (typeof raw.candidateId === "string") {
    razorpayRecordIds = [raw.candidateId];
  }

  const confidence =
    typeof raw.confidence === "number"
      ? raw.confidence
      : isMatch && razorpayRecordIds.length > 0
        ? 0.9
        : 0;

  const reason =
    typeof raw.reason === "string" && raw.reason.trim().length > 0
      ? raw.reason
      : isMatch
        ? "AI identified the strongest candidate match."
        : "AI could not confidently resolve this transaction.";

  return {
    ledgerRecordId,
    decision: isMatch && razorpayRecordIds.length > 0 ? "match" : "unresolved",
    razorpayRecordIds: isMatch ? razorpayRecordIds : [],
    confidence,
    reason,
  };
}

function normalizeBatchResponse(parsed: any): { decisions: any[] } {
  if (typeof parsed !== "object" || parsed === null) {
    return { decisions: [] };
  }

  let rawDecisions: any[] = [];
  if (Array.isArray(parsed.decisions)) {
    rawDecisions = parsed.decisions;
  } else if (Array.isArray(parsed.results)) {
    rawDecisions = parsed.results;
  } else if (Array.isArray(parsed.items)) {
    rawDecisions = parsed.items;
  } else if (Array.isArray(parsed)) {
    rawDecisions = parsed;
  }

  return {
    decisions: rawDecisions.map(normalizeBatchDecision),
  };
}

function toPromptRecord(record: NormalizedRazorpayRecord) {
  return {
    id: record.id,
    paymentId: record.paymentId ?? null,
    orderId: record.orderId ?? null,
    amountGross: formatINR(record.grossAmountPaise),
    amountSettled: formatINR(record.netAmountPaise),
    fee: formatINR(record.feePaise),
    tax: formatINR(record.taxPaise),
    date: record.date.toISOString().slice(0, 10),
  };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGroqWithRetry(
  batch: { ledger: NormalizedLedgerRecord; candidates: NormalizedRazorpayRecord[] }[],
  batchIndex: number,
  totalBatches: number
): Promise<AIMatchDecision[]> {
  if (!groq) return [];
  const batchStart = Date.now();
  console.log(`[AI] Batch ${batchIndex + 1}/${totalBatches}`);

  const max429Retries = 3;
  const backoffDelays = [1000, 2000, 4000];
  let rateLimitAttempt = 0;
  let jsonValidationAttempts = 0;
  const maxJsonRetries = 1;

  while (rateLimitAttempt <= max429Retries) {
    try {
      const completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        temperature: 0,
        max_tokens: 900,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: `You are a financial reconciliation assistant.

You receive a batch of items. Each item contains one merchant ledger record ("ledger") and up to 5 candidate Razorpay records ("candidates").

Your task is to evaluate each item independently and decide whether one or more candidate Razorpay records plausibly correspond to the ledger record.

You MUST return ONLY one JSON object with a single top-level key "decisions" containing an array of decision objects for each item in the batch.

Expected JSON output format:
{
  "decisions": [
    {
      "ledgerRecordId": "id-of-ledger-record",
      "decision": "match" | "unresolved",
      "razorpayRecordIds": ["candidate-id"],
      "confidence": 0.0 to 1.0,
      "reason": "short explanation"
    }
  ]
}

Rules for reason:
- Return a short reason in plain merchant-friendly language.
- One sentence only
- Maximum 10-12 words
- Explain the strongest reason for match or unresolved
- No technical AI terms or generic filler

General Rules:
- Always include ledgerRecordId matching the item's ledger.id.
- Always include decision, razorpayRecordIds, confidence, and reason.
- If unresolved, set decision to "unresolved", razorpayRecordIds to [], confidence to 0.0.
- If matched, razorpayRecordIds must contain only candidate IDs provided for that specific ledger record.
- Never invent IDs, amounts, dates, fees, or settlements.
- Prefer unresolved when evidence is weak.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              items: batch.map((item) => ({
                ledger: {
                  id: item.ledger.id,
                  orderId: item.ledger.orderId,
                  amountExpected: formatINR(item.ledger.amountPaise),
                  date: item.ledger.date.toISOString().slice(0, 10),
                },
                candidates: item.candidates.map(toPromptRecord),
              })),
              requiredOutput: {
                decisions: [
                  {
                    ledgerRecordId: "id-of-ledger-record",
                    decision: "match | unresolved",
                    razorpayRecordIds: ["candidate-id"],
                    confidence: "number between 0 and 1",
                    reason: "short explanation (max 10-12 words, 1 sentence)",
                  },
                ],
              },
            }),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content ?? undefined;
      if (!content) {
        throw new Error("Groq returned empty response");
      }

      let parsedRaw: any;
      try {
        parsedRaw = JSON.parse(content);
      } catch (parseErr) {
        throw new Error(`JSON parse error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
      }

      const normalized = normalizeBatchResponse(parsedRaw);
      const output = aiBatchOutputSchema.parse(normalized);
      const batchDuration = Date.now() - batchStart;
      console.log(`[AI] Batch completed in ${batchDuration} ms`);
      return output.decisions;
    } catch (error: any) {
      const isRateLimit =
        error?.status === 429 ||
        error?.statusCode === 429 ||
        String(error?.message || "").includes("429") ||
        String(error?.message || "").toLowerCase().includes("rate_limit");

      if (isRateLimit && rateLimitAttempt < max429Retries) {
        let retryAfterMs = backoffDelays[rateLimitAttempt] ?? 1000;
        const retryHeader =
          error?.headers?.["retry-after"] ||
          error?.response?.headers?.get?.("retry-after");
        if (retryHeader) {
          const parsedHeader = parseFloat(retryHeader);
          if (!isNaN(parsedHeader)) {
            retryAfterMs = Math.ceil(parsedHeader * 1000);
          }
        }

        console.log(`[AI] Rate limited, retrying in ${retryAfterMs} ms`);
        await sleep(retryAfterMs);
        rateLimitAttempt++;
        continue;
      }

      const isJsonError =
        String(error?.message || "").includes("json_validate_failed") ||
        String(error?.message || "").includes("JSON parse error") ||
        String(error?.message || "").includes("ZodError") ||
        error?.name === "ZodError";

      if (isJsonError && jsonValidationAttempts < maxJsonRetries) {
        jsonValidationAttempts++;
        console.log(`[AI] JSON generation failed, retrying batch ${batchIndex + 1}`);
        await sleep(500);
        continue;
      }

      console.error(`[AI] Groq batch error (Batch ${batchIndex + 1}):`, error);
      const batchDuration = Date.now() - batchStart;
      console.log(`[AI] Batch completed in ${batchDuration} ms`);
      return [];
    }
  }

  return [];
}

export async function aiMatcher(
  ledgers: NormalizedLedgerRecord[],
  razorpayRecords: NormalizedRazorpayRecord[],
  usedIds: Set<string>
): Promise<{
  matches: MatchResult[];
  unresolved: UnresolvedItem[];
}> {
  const startTime = Date.now();

  if (!process.env.GROQ_API_KEY || !groq) {
    console.error("[AI] GROQ_API_KEY is missing");
  }

  const itemsToEvaluate: { ledger: NormalizedLedgerRecord; candidates: NormalizedRazorpayRecord[] }[] = [];
  const unresolved: UnresolvedItem[] = [];

  for (const ledger of ledgers) {
    const candidates = selectCandidates(ledger, razorpayRecords, usedIds, MATCH_CONSTANTS.maxAiCandidates);
    if (candidates.length === 0) {
      unresolved.push({ ledger, aiDecision: null, candidates: [] });
    } else {
      itemsToEvaluate.push({ ledger, candidates });
    }
  }

  const BATCH_SIZE = 5;
  const batches: typeof itemsToEvaluate[] = [];
  for (let i = 0; i < itemsToEvaluate.length; i += BATCH_SIZE) {
    batches.push(itemsToEvaluate.slice(i, i + BATCH_SIZE));
  }

  let groqRequestCount = 0;
  let acceptedCount = 0;

  const batchResults: AIMatchDecision[][] = [];
  for (let i = 0; i < batches.length; i++) {
    if (groq) groqRequestCount++;
    const decisions = await callGroqWithRetry(batches[i], i, batches.length);
    batchResults.push(decisions);
  }

  const matches: MatchResult[] = [];

  batches.forEach((batch, batchIndex) => {
    const decisions = batchResults[batchIndex] ?? [];
    const decisionMap = new Map<string, AIMatchDecision>();
    decisions.forEach((d) => {
      decisionMap.set(d.ledgerRecordId, d);
    });

    for (const item of batch) {
      const decision = decisionMap.get(item.ledger.id) ?? null;
      const allowedIds = new Set(item.candidates.map((c) => c.id));
      const validMatchedIds = decision?.razorpayRecordIds.filter((id) => allowedIds.has(id) && !usedIds.has(id)) ?? [];

      if (
        decision &&
        decision.decision === "match" &&
        decision.confidence >= MATCH_CONSTANTS.aiAcceptConfidence &&
        validMatchedIds.length > 0
      ) {
        const matchedCandidates = item.candidates.filter((c) => validMatchedIds.includes(c.id));
        matchedCandidates.forEach((c) => usedIds.add(c.id));

        matches.push({
          ledger: item.ledger,
          razorpayRecords: matchedCandidates,
          method: "ai_assisted",
          confidence: decision.confidence,
          status: "matched",
          reason: decision.reason,
        });
        acceptedCount++;
      } else {
        unresolved.push({ ledger: item.ledger, aiDecision: decision, candidates: item.candidates });
      }
    }
  });

  const durationMs = Date.now() - startTime;
  const totalUnresolvedCount = unresolved.length;

  console.log(`[AI] Records requiring AI: ${itemsToEvaluate.length}`);
  console.log(`[AI] Batches: ${batches.length}`);
  console.log(`[AI] Groq requests: ${groqRequestCount}`);
  console.log(`[AI] Total AI processing time: ${durationMs} ms`);
  console.log(`[AI] Accepted matches: ${acceptedCount}`);
  console.log(`[AI] Unresolved: ${totalUnresolvedCount}`);

  return { matches, unresolved };
}
