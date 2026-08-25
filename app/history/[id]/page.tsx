import { redirect } from "next/navigation";

type HistoryRunPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HistoryRunPage({ params }: HistoryRunPageProps) {
  const { id } = await params;
  redirect(`/reconcile/results?run=${id}`);
}
