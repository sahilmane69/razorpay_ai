export type LedgerRecord = {
  id?: string;
  orderId: string;
  customer: string;
  amountExpected: number;
  date: string;
};

export type RazorpayRecord = {
  id?: string;
  paymentId: string;
  orderId?: string;
  settlementId?: string;
  amountGross: number;
  fee: number;
  tax?: number;
  amountSettled: number;
  utr?: string;
  date: string;
};

export type MatchMethod =
  | "exact"
  | "fee_adjusted"
  | "split"
  | "ai_assisted"
  | "unresolved";

export type ReconciliationStatus = "matched" | "review";

export type ReconciliationResult = {
  orderId: string;
  ledger: LedgerRecord;
  razorpayRecords: RazorpayRecord[];
  method: MatchMethod;
  confidence?: number;
  status: ReconciliationStatus;
  reason: string;
};

export type ExceptionType =
  | "AMOUNT_MISMATCH"
  | "MISSING_RAZORPAY_RECORD"
  | "DUPLICATE_PAYMENT"
  | "AMBIGUOUS_MATCH"
  | "DATE_MISMATCH"
  | "AI_LOW_CONFIDENCE"
  | "INVALID_LEDGER_RECORD"
  | "amount_mismatch"
  | "missing_settlement"
  | "duplicate_payment"
  | "ambiguous_match";

export type ExceptionItem = {
  id?: string;
  orderId: string;
  type: ExceptionType;
  explanation: string;
  ledgerAmount: number;
  closestCandidate?: RazorpayRecord;
  status?: "OPEN" | "RESOLVED";
};

export type BatchSummary = {
  totalRecords: number;
  resolved: number;
  unresolved: number;
  matchRate: number;
  accuracy: number | null;
  precision?: number | null;
  processingTimeSeconds: number;
  exactMatches: number;
  ruleBased: number;
  aiAssisted: number;
};

export type ReconciliationRun = {
  id: string;
  date: string;
  ledgerFile: string;
  records: number;
  matchRate: number;
  accuracy: number | null;
  exceptions: number;
  status: "processing" | "completed" | "failed";
};

export type LedgerUpload = {
  id: string;
  fileName: string;
  rowCount: number;
  rejectedCount?: number;
};
