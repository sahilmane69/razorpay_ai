import { getAuthenticatedBusiness } from "@/lib/auth/session";
import { handleRouteError, userError } from "@/lib/api/errors";
import { reconcile } from "@/lib/reconciliation/reconcile";
import type { NormalizedLedgerRecord, NormalizedRazorpayRecord } from "@/lib/reconciliation/types";
import { z } from "zod";

const BodySchema = z.object({
  ledgerUploadId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const { business, supabase } = await getAuthenticatedBusiness();
    const body = BodySchema.safeParse(await request.json());
    if (!body.success) {
      return userError("A valid ledger upload is required.");
    }

    const { data: upload } = await supabase
      .from("ledger_uploads")
      .select("id")
      .eq("id", body.data.ledgerUploadId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (!upload) {
      return userError("That ledger upload was not found.");
    }

    const { data: active } = await supabase
      .from("reconciliation_runs")
      .select("id")
      .eq("ledger_upload_id", upload.id)
      .eq("status", "processing")
      .maybeSingle();

    if (active) {
      return userError("A reconciliation is already running for this ledger.");
    }

    const { data: ledgerRows, error: ledgerError } = await supabase
      .from("ledger_records")
      .select("*")
      .eq("upload_id", upload.id)
      .eq("business_id", business.id);

    if (ledgerError) throw ledgerError;
    if (!ledgerRows || ledgerRows.length === 0) {
      return userError("This ledger has no valid records to reconcile.");
    }

    const { data: razorpayRows, error: razorpayError } = await supabase
      .from("razorpay_transactions")
      .select("*")
      .eq("business_id", business.id);

    if (razorpayError) throw razorpayError;
    if (!razorpayRows || razorpayRows.length === 0) {
      return userError("No Razorpay transactions are available for reconciliation.");
    }

    const { data: run, error: runError } = await supabase
      .from("reconciliation_runs")
      .insert({
        business_id: business.id,
        ledger_upload_id: upload.id,
        total_records: ledgerRows.length,
        resolved_records: 0,
        exception_count: 0,
        match_rate: 0,
        processing_time_ms: 0,
        status: "processing",
      })
      .select("id")
      .single();

    if (runError || !run) {
      if (runError?.code === "23505") {
        return userError("A reconciliation is already running for this ledger.");
      }
      throw runError ?? new Error("Could not start reconciliation.");
    }

    try {
      const ledgers: NormalizedLedgerRecord[] = ledgerRows.map((row) => ({
        id: row.id,
        orderId: row.order_id,
        customer: row.customer ?? undefined,
        amountPaise: Number(row.amount_paise),
        date: new Date(row.transaction_date),
      }));

      const razorpayRecords: NormalizedRazorpayRecord[] = razorpayRows.map((row) => ({
        id: row.id,
        paymentId: row.razorpay_payment_id ?? undefined,
        orderId: row.razorpay_order_id ?? undefined,
        settlementId: row.settlement_id ?? undefined,
        grossAmountPaise: Number(row.gross_amount_paise),
        feePaise: Number(row.fee_paise),
        taxPaise: Number(row.tax_paise),
        netAmountPaise: Number(row.net_amount_paise),
        utr: row.utr ?? undefined,
        date: new Date(row.transaction_date),
      }));

      const output = await reconcile(ledgers, razorpayRecords);
      const resolved = output.matches.filter((match) => match.status === "matched").length;
      const matchRate = output.matches.length === 0 ? 0 : resolved / output.matches.length;

      for (const match of output.matches) {
        const { data: result, error: resultError } = await supabase
          .from("reconciliation_results")
          .insert({
            run_id: run.id,
            business_id: business.id,
            ledger_record_id: match.ledger.id,
            method: match.method,
            confidence: match.confidence ?? null,
            reason: match.reason,
            status: match.status,
          })
          .select("id")
          .single();

        if (resultError || !result) throw resultError;

        if (match.razorpayRecords.length > 0) {
          const { error: linkError } = await supabase
            .from("reconciliation_result_transactions")
            .insert(
              match.razorpayRecords.map((record) => ({
                result_id: result.id,
                razorpay_transaction_id: record.id,
              }))
            );
          if (linkError) throw linkError;
        }
      }

      if (output.exceptions.length > 0) {
        const { error: exceptionError } = await supabase.from("exceptions").insert(
          output.exceptions.map((item) => ({
            run_id: run.id,
            business_id: business.id,
            ledger_record_id: item.ledger.id,
            type: item.type,
            reason: item.reason,
            status: "OPEN",
          }))
        );
        if (exceptionError) throw exceptionError;
      }

      const { error: completeError } = await supabase
        .from("reconciliation_runs")
        .update({
          total_records: output.matches.length,
          resolved_records: resolved,
          exception_count: output.exceptions.length,
          match_rate: matchRate,
          accuracy: output.evaluation?.accuracy ?? null,
          precision_score: output.evaluation?.precision ?? null,
          recall_score: output.evaluation?.recall ?? null,
          processing_time_ms: output.processingTimeMs,
          status: "completed",
        })
        .eq("id", run.id)
        .eq("business_id", business.id);

      if (completeError) throw completeError;

      return Response.json({
        runId: run.id,
        total: output.matches.length,
        resolved,
        exceptions: output.exceptions.length,
        matchRate,
        accuracy: output.evaluation?.accuracy ?? null,
        processingTimeMs: output.processingTimeMs,
      });
    } catch (error) {
      await supabase
        .from("reconciliation_runs")
        .update({ status: "failed", processing_time_ms: 0 })
        .eq("id", run.id)
        .eq("business_id", business.id);
      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
