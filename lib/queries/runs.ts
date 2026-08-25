import "server-only";

import { AuthError, getAuthenticatedBusiness } from "@/lib/auth/session";
import type { BatchSummary, ExceptionItem, ReconciliationResult, ReconciliationRun } from "@/lib/types";

type LedgerRow = {
  id: string;
  order_id: string;
  customer: string | null;
  amount_paise: number;
  transaction_date: string;
};

type RazorpayRow = {
  id: string;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  settlement_id: string | null;
  gross_amount_paise: number;
  fee_paise: number;
  tax_paise: number;
  net_amount_paise: number;
  utr: string | null;
  transaction_date: string;
};

function toRazorpayRecord(row: RazorpayRow) {
  return {
    id: row.id,
    paymentId: row.razorpay_payment_id ?? row.settlement_id ?? row.id,
    orderId: row.razorpay_order_id ?? undefined,
    settlementId: row.settlement_id ?? undefined,
    amountGross: Number(row.gross_amount_paise),
    fee: Number(row.fee_paise),
    tax: Number(row.tax_paise),
    amountSettled: Number(row.net_amount_paise),
    utr: row.utr ?? undefined,
    date: row.transaction_date,
  };
}

export async function loadHistory() {
  const { supabase } = await getAuthenticatedBusiness();
  const { data, error } = await supabase
    .from("reconciliation_runs")
    .select("id, created_at, total_records, match_rate, accuracy, exception_count, status, ledger_uploads(file_name)")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((run) => {
    const upload = run.ledger_uploads as { file_name: string } | { file_name: string }[] | null;
    const fileName = Array.isArray(upload) ? upload[0]?.file_name : upload?.file_name;

    return {
      id: run.id,
      date: run.created_at,
      ledgerFile: fileName ?? "ledger.csv",
      records: run.total_records,
      matchRate: Number(run.match_rate),
      accuracy: run.accuracy === null ? null : Number(run.accuracy),
      exceptions: run.exception_count,
      status: run.status,
    } satisfies ReconciliationRun;
  });
}

export async function loadRunBundle(runId?: string) {
  const { supabase, business } = await getAuthenticatedBusiness();

  let query = supabase
    .from("reconciliation_runs")
    .select("*, ledger_uploads(file_name)")
    .eq("business_id", business.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1);

  if (runId) {
    query = supabase
      .from("reconciliation_runs")
      .select("*, ledger_uploads(file_name)")
      .eq("business_id", business.id)
      .eq("id", runId)
      .limit(1);
  }

  const { data: runs, error: runError } = await query;
  if (runError) throw runError;
  const run = runs?.[0];
  if (!run) return null;

  const { data: resultRows, error: resultsError } = await supabase
    .from("reconciliation_results")
    .select("*, ledger_records(*), reconciliation_result_transactions(razorpay_transactions(*))")
    .eq("run_id", run.id)
    .order("created_at", { ascending: true });

  if (resultsError) throw resultsError;

  const { data: exceptionRows, error: exceptionError } = await supabase
    .from("exceptions")
    .select("*, ledger_records(*)")
    .eq("run_id", run.id)
    .order("created_at", { ascending: true });

  if (exceptionError) throw exceptionError;

  const results: ReconciliationResult[] = (resultRows ?? []).map((row) => {
    const ledger = row.ledger_records as LedgerRow;
    const links = row.reconciliation_result_transactions as
      | { razorpay_transactions: RazorpayRow }[]
      | null;

    return {
      orderId: ledger.order_id,
      ledger: {
        id: ledger.id,
        orderId: ledger.order_id,
        customer: ledger.customer ?? "",
        amountExpected: Number(ledger.amount_paise),
        date: ledger.transaction_date,
      },
      razorpayRecords: (links ?? []).map((link) => toRazorpayRecord(link.razorpay_transactions)),
      method: row.method,
      confidence: row.confidence === null ? undefined : Number(row.confidence),
      status: row.status,
      reason: row.reason,
    };
  });

  const exceptions: ExceptionItem[] = (exceptionRows ?? []).map((row) => {
    const ledger = row.ledger_records as LedgerRow | null;
    const related = results.find((result) => result.orderId === ledger?.order_id);
    return {
      id: row.id,
      orderId: ledger?.order_id ?? "—",
      type: row.type,
      explanation: row.reason,
      ledgerAmount: ledger ? Number(ledger.amount_paise) : 0,
      closestCandidate: related?.razorpayRecords[0],
      status: row.status,
    };
  });

  const summary: BatchSummary = {
    totalRecords: run.total_records,
    resolved: run.resolved_records,
    unresolved: run.exception_count,
    matchRate: Number(run.match_rate),
    accuracy: run.accuracy === null ? null : Number(run.accuracy),
    precision: run.precision_score === null ? null : Number(run.precision_score),
    processingTimeSeconds: Number((run.processing_time_ms / 1000).toFixed(1)),
    exactMatches: results.filter((result) => result.method === "exact").length,
    ruleBased: results.filter(
      (result) => result.method === "fee_adjusted" || result.method === "split"
    ).length,
    aiAssisted: results.filter((result) => result.method === "ai_assisted").length,
  };

  const upload = run.ledger_uploads as { file_name: string } | { file_name: string }[] | null;
  const fileName = Array.isArray(upload) ? upload[0]?.file_name : upload?.file_name;

  return {
    run: {
      id: run.id,
      date: run.created_at,
      ledgerFile: fileName ?? "ledger.csv",
      records: run.total_records,
      matchRate: Number(run.match_rate),
      accuracy: run.accuracy === null ? null : Number(run.accuracy),
      exceptions: run.exception_count,
      status: run.status,
    } satisfies ReconciliationRun,
    summary,
    results,
    exceptions,
  };
}

export async function requireUser() {
  try {
    return await getAuthenticatedBusiness();
  } catch (error) {
    if (error instanceof AuthError) return null;
    throw error;
  }
}
