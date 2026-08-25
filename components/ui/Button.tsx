import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark shadow-[0_1px_2px_rgba(28,25,23,0.12)]",
  secondary:
    "bg-surface text-ink border border-line hover:bg-warm",
  ghost: "bg-transparent text-ink hover:bg-warm",
  danger: "bg-alert-bg text-alert hover:bg-[#f3dcd8]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md"
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size]
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClassName(variant, size), className)}
      {...props}
    />
  );
}
