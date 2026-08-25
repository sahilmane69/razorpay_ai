import { PageContainer } from "@/components/layout/PageContainer";
import { buttonClassName } from "@/components/ui/Button";
import Link from "next/link";

export default function NotFound() {
  return (
    <PageContainer className="py-24 text-center">
      <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        That screen is not part of ReconFlow.
      </p>
      <Link href="/" className={`${buttonClassName("secondary")} mt-6`}>
        Back to dashboard
      </Link>
    </PageContainer>
  );
}
