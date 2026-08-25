"use client";

import { createClient } from "@/utils/supabase/client";
import { User } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/reconcile", label: "Reconcile" },
  { href: "/history", label: "History" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const [businessName, setBusinessName] = useState("Account");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthPage) return;
    const supabase = createClient();
    void supabase
      .from("businesses")
      .select("name")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setBusinessName(data.name);
      });
  }, [isAuthPage]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href={isAuthPage ? "/login" : "/"} className="text-[15px] font-semibold tracking-tight text-ink">
          ReconFlow
        </Link>

        {!isAuthPage && (
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
        )}

        {!isAuthPage && (
          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[12px] border border-line bg-surface px-3 py-1.5 text-sm text-ink"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <User size={16} weight="bold" />
              <span className="hidden sm:inline">{businessName}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-[12px] border border-line bg-surface shadow-[0_8px_24px_rgba(28,25,23,0.08)]">
                <Link
                  href="/settings"
                  className="block px-3 py-2 text-sm hover:bg-warm"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-warm"
                  onClick={() => void signOut()}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {!isAuthPage && (
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
      )}
    </header>
  );
}
