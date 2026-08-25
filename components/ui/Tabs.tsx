"use client";

import { cn } from "@/lib/cn";

type Tab<T extends string> = {
  id: T;
  label: string;
};

type TabsProps<T extends string> = {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function Tabs<T extends string>({ tabs, value, onChange }: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1 rounded-[12px] bg-warm p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors",
            value === tab.id
              ? "bg-surface text-ink shadow-[0_1px_2px_rgba(28,25,23,0.06)]"
              : "text-muted hover:text-ink"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
