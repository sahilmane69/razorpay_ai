import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type BadgeTone = "matched" | "review" | "neutral" | "test" | "method";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const tones: Record<BadgeTone, string> = {
  matched: "bg-match-bg text-match",
  review: "bg-review-bg text-review",
  neutral: "bg-warm text-muted",
  test: "bg-[#EEF4FC] text-primary-dark",
  method: "bg-warm text-ink",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[8px] px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
