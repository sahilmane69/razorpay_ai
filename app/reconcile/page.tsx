import { PageContainer } from "@/components/layout/PageContainer";
import { ReconcileWorkflow } from "@/components/reconcile/ReconcileWorkflow";
import { getAuthenticatedBusiness } from "@/lib/auth/session";
import { isRazorpayConfigured } from "@/lib/razorpay/client";

export default async function ReconcilePage() {
  const { supabase, business } = await getAuthenticatedBusiness();
  const { count } = await supabase
    .from("razorpay_transactions")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  return (
    <PageContainer>
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">
        New reconciliation
      </h1>
      <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">
        Upload your ledger and compare it with Razorpay transactions.
      </p>
      <div className="mt-8">
        <ReconcileWorkflow
          razorpayConnected={isRazorpayConfigured()}
          razorpayStored={count ?? 0}
        />
      </div>
    </PageContainer>
  );
}
