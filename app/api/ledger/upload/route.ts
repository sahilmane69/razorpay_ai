import { AuthError, getAuthenticatedBusiness } from "@/lib/auth/session";
import { parseLedgerCsv } from "@/lib/ledger/parseCsv";
import { handleRouteError, userError } from "@/lib/api/errors";

export async function POST(request: Request) {
  try {
    const { business, supabase } = await getAuthenticatedBusiness();
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return userError("Please choose a CSV file.");
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return userError("Please upload a CSV file.");
    }

    const parsed = parseLedgerCsv(await file.text());

    const { data: upload, error: uploadError } = await supabase
      .from("ledger_uploads")
      .insert({
        business_id: business.id,
        file_name: file.name,
        record_count: parsed.rows.length,
        rejected_count: parsed.rejected.length,
      })
      .select("id, file_name, record_count, rejected_count")
      .single();

    if (uploadError || !upload) {
      throw uploadError ?? new Error("upload failed");
    }

    if (parsed.rows.length > 0) {
      const { error: rowsError } = await supabase.from("ledger_records").insert(
        parsed.rows.map((row) => ({
          business_id: business.id,
          upload_id: upload.id,
          order_id: row.orderId,
          customer: row.customer,
          amount_paise: row.amountPaise,
          transaction_date: row.date.toISOString(),
        }))
      );
      if (rowsError) throw rowsError;
    }

    return Response.json({
      uploadId: upload.id,
      fileName: upload.file_name,
      accepted: upload.record_count,
      rejected: upload.rejected_count,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("missing the required")) {
      return userError(error.message);
    }
    if (error instanceof Error && error.message.includes("CSV")) {
      return userError(error.message);
    }
    if (error instanceof AuthError) {
      return handleRouteError(error);
    }
    return handleRouteError(error);
  }
}
