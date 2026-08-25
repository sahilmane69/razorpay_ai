"use client";

import { Badge } from "@/components/ui/Badge";
import { MERCHANT_NAME } from "@/lib/mock-data";
import { User } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/reconcile", label: "Reconcile" },
  { href: "/history", label: "History" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">
            ReconFlow
          </Link>
          <Badge tone="test">Razorpay Test Mode</Badge>
        </div>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "rounded-[10px] bg-warm px-3 py-1.5 text-sm font-medium text-ink"
                    : "rounded-[10px] px-3 py-1.5 text-sm text-muted hover:text-ink"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-3 py-1.5 text-sm text-ink"
        >
          <User size={16} weight="bold" />
          <span className="hidden sm:inline">{MERCHANT_NAME}</span>
        </button>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-line px-5 py-2 sm:hidden">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "rounded-[10px] bg-warm px-3 py-1.5 text-sm font-medium text-ink"
                  : "rounded-[10px] px-3 py-1.5 text-sm text-muted"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
