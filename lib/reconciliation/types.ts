export type MatchMethod =
  | "exact"
  | "fee_adjusted"
  | "split"
  | "ai_assisted"
  | "unresolved";

export type MatchStatus = "matched" | "review";

export type ExceptionType =
  | "AMOUNT_MISMATCH"
  | "MISSING_RAZORPAY_RECORD"
  | "DUPLICATE_PAYMENT"
  | "AMBIGUOUS_MATCH"
  | "DATE_MISMATCH"
  | "AI_LOW_CONFIDENCE"
  | "INVALID_LEDGER_RECORD";

export type NormalizedLedgerRecord = {
  id: string;
  orderId: string;
  customer?: string;
  amountPaise: number;
  date: Date;
};

export type NormalizedRazorpayRecord = {
  id: string;
  paymentId?: string;
  orderId?: string;
  settlementId?: string;
  grossAmountPaise: number;
  feePaise: number;
  taxPaise: number;
  netAmountPaise: number;
  utr?: string;
  date: Date;
};

export type MatchResult = {
  ledger: NormalizedLedgerRecord;
  razorpayRecords: NormalizedRazorpayRecord[];
  method: MatchMethod;
  confidence?: number;
  status: MatchStatus;
  reason: string;
};

export type ProposedException = {
  ledger: NormalizedLedgerRecord;
  type: ExceptionType;
  reason: string;
  closest?: NormalizedRazorpayRecord;
};

export type AIMatchDecision = {
  ledgerRecordId: string;
  razorpayRecordIds: string[];
  decision: "match" | "unresolved";
  confidence: number;
  reason: string;
};

export type ReconciliationOutput = {
  matches: MatchResult[];
  exceptions: ProposedException[];
};

export const MATCH_CONSTANTS = {
  maxAiCandidates: 5,
  dateWindowDays: 7,
  aiAcceptConfidence: 0.85,
  maxSplitParts: 3,
  maxSplitCandidates: 8,
} as const;
