import { PageContainer } from "@/components/layout/PageContainer";
import { ReconcileWorkflow } from "@/components/reconcile/ReconcileWorkflow";

export default function ReconcilePage() {
  return (
    <PageContainer>
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">
        New reconciliation
      </h1>
      <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted">
        Upload your ledger and compare it with Razorpay transactions.
      </p>
      <div className="mt-8">
        <ReconcileWorkflow />
      </div>
    </PageContainer>
  );
}
