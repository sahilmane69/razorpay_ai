import { Card } from "@/components/ui/Card";

type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
};

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-tight text-ink">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted">{hint}</p>
    </Card>
  );
}
