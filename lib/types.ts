export type LedgerRecord = {
  orderId: string;
  customer: string;
  amountExpected: number;
  date: string;
};

export type RazorpayRecord = {
  paymentId: string;
  orderId?: string;
  settlementId?: string;
  amountGross: number;
  fee: number;
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
  | "amount_mismatch"
  | "missing_settlement"
  | "duplicate_payment"
  | "ambiguous_match";

export type ExceptionItem = {
  orderId: string;
  type: ExceptionType;
  explanation: string;
  ledgerAmount: number;
  closestCandidate?: RazorpayRecord;
};

export type BatchSummary = {
  totalRecords: number;
  resolved: number;
  unresolved: number;
  matchRate: number;
  accuracy: number;
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
  exceptions: number;
  status: "completed" | "failed";
};

export type LedgerUpload = {
  fileName: string;
  rowCount: number;
};
