import { getAuthenticatedBusiness } from "@/lib/auth/session";
import { handleRouteError } from "@/lib/api/errors";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

type SampleTransaction = {
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  settlement_id: string | null;
  gross_amount_paise: number;
  fee_paise: number;
  tax_paise: number;
  net_amount_paise: number;
  utr: string | null;
  transaction_date: string;
  raw_data: Record<string, unknown>;
};

export async function POST() {
  try {
    const { business, supabase } = await getAuthenticatedBusiness();
    const filePath = join(process.cwd(), "data/evaluation/razorpay.json");
    const fileContent = await readFile(filePath, "utf8");
    const records = JSON.parse(fileContent) as SampleTransaction[];

    // Delete existing synthetic records for this business only
    const { error: deleteError } = await supabase
      .from("razorpay_transactions")
      .delete()
      .eq("business_id", business.id)
      .eq("raw_data->>source", "synthetic");

    if (deleteError) {
      throw deleteError;
    }

    const rowsToInsert = records.map((record) => ({
      business_id: business.id,
      razorpay_payment_id: record.razorpay_payment_id,
      razorpay_order_id: record.razorpay_order_id,
      settlement_id: record.settlement_id,
      gross_amount_paise: record.gross_amount_paise,
      fee_paise: record.fee_paise,
      tax_paise: record.tax_paise,
      net_amount_paise: record.net_amount_paise,
      utr: record.utr,
      transaction_date: record.transaction_date,
      raw_data: record.raw_data,
    }));

    const { error: insertError } = await supabase
      .from("razorpay_transactions")
      .insert(rowsToInsert);

    if (insertError) {
      throw insertError;
    }

    return Response.json({
      success: true,
      stored: records.length,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
