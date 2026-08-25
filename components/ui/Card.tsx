import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-line bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)]",
        className
      )}
      {...props}
    />
  );
}
