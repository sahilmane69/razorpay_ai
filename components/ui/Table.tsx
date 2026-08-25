import { cn } from "@/lib/cn";
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full min-w-[640px] text-left text-sm", className)} {...props} />
    </div>
  );
}

export function THead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-line text-xs font-medium text-muted", className)}
      {...props}
    />
  );
}

export function TBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-line", className)} {...props} />;
}

export function TR({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={className} {...props} />;
}

export function TH({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("px-4 py-3 font-medium", className)} {...props} />
  );
}

export function TD({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 text-ink", className)} {...props} />;
}
