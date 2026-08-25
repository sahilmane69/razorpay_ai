import { getAuthenticatedBusiness } from "@/lib/auth/session";
import { handleRouteError } from "@/lib/api/errors";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

type SeedRecord = {
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
    const file = join(process.cwd(), "data/evaluation/razorpay.json");
    const records = JSON.parse(await readFile(file, "utf8")) as SeedRecord[];

    for (const row of records) {
      if (row.razorpay_payment_id) {
        const { data: existing } = await supabase
          .from("razorpay_transactions")
          .select("id")
          .eq("business_id", business.id)
          .eq("razorpay_payment_id", row.razorpay_payment_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("razorpay_transactions")
            .update({ ...row, raw_data: row.raw_data })
            .eq("id", existing.id);
        } else {
          await supabase.from("razorpay_transactions").insert({
            business_id: business.id,
            ...row,
          });
        }
      } else {
        await supabase.from("razorpay_transactions").insert({
          business_id: business.id,
          ...row,
        });
      }
    }

    return Response.json({ seeded: records.length });
  } catch (error) {
    return handleRouteError(error);
  }
}
