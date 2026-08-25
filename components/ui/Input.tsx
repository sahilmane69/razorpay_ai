import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-[12px] border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted outline-none focus:border-primary",
        className
      )}
      {...props}
    />
  );
}
