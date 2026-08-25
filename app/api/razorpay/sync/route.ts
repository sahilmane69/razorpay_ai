import { getAuthenticatedBusiness } from "@/lib/auth/session";
import { handleRouteError, userError } from "@/lib/api/errors";
import {
  fetchPayments,
  fetchSettlementDetails,
  fetchSettlements,
  isRazorpayConfigured,
} from "@/lib/razorpay/client";
import {
  attachSettlementId,
  normalizePayment,
  normalizeSettlement,
  type NormalizedRazorpayInsert,
} from "@/lib/razorpay/normalize";

export async function GET() {
  try {
    const { supabase, business } = await getAuthenticatedBusiness();
    const { count } = await supabase
      .from("razorpay_transactions")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id);

    return Response.json({
      connected: isRazorpayConfigured(),
      stored: count ?? 0,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST() {
  try {
    const { supabase, business } = await getAuthenticatedBusiness();

    if (!isRazorpayConfigured()) {
      return userError("Razorpay is not connected.");
    }

    let payments: Record<string, unknown>[] = [];
    let settlements: Record<string, unknown>[] = [];

    try {
      payments = await fetchPayments();
      settlements = await fetchSettlements();
    } catch (error) {
      console.error(error);
      return userError("Could not sync Razorpay. Please try again.");
    }

    const paymentRows = payments
      .map(normalizePayment)
      .filter((row): row is NormalizedRazorpayInsert => Boolean(row));

    for (const settlement of settlements.slice(0, 25)) {
      const id = typeof settlement.id === "string" ? settlement.id : null;
      if (!id) continue;
      try {
        const details = await fetchSettlementDetails(id);
        const items = (details.items ?? details.payments) as unknown;
        if (Array.isArray(items)) {
          for (const item of items) {
            const paymentId =
              typeof item === "object" && item && "entity_id" in item
                ? String((item as { entity_id: string }).entity_id)
                : typeof item === "object" && item && "id" in item
                  ? String((item as { id: string }).id)
                  : null;
            const match = paymentRows.find((row) => row.razorpay_payment_id === paymentId);
            if (match) {
              Object.assign(match, attachSettlementId(match, id));
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    const settlementRows = settlements
      .map(normalizeSettlement)
      .filter((row): row is NormalizedRazorpayInsert => Boolean(row));

    const allRows = [...paymentRows, ...settlementRows.filter((row) => !row.razorpay_payment_id)];

    for (const row of allRows) {
      if (row.razorpay_payment_id) {
        const { error } = await supabase.from("razorpay_transactions").upsert(
          { business_id: business.id, ...row },
          { onConflict: "business_id,razorpay_payment_id" }
        );
        if (error) {
          const { error: insertError } = await supabase.from("razorpay_transactions").insert({
            business_id: business.id,
            ...row,
          });
          if (insertError && !insertError.message.toLowerCase().includes("duplicate")) {
            console.error(insertError);
          }
        }
      } else {
        const { data: existing } = await supabase
          .from("razorpay_transactions")
          .select("id")
          .eq("business_id", business.id)
          .eq("settlement_id", row.settlement_id)
          .is("razorpay_payment_id", null)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("razorpay_transactions")
            .update(row)
            .eq("id", existing.id);
        } else {
          await supabase.from("razorpay_transactions").insert({
            business_id: business.id,
            ...row,
          });
        }
      }
    }

    return Response.json({
      payments: paymentRows.length,
      settlements: settlements.length,
      synced: allRows.length,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
