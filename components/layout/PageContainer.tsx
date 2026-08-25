import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn("mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8", className)}>
      {children}
    </main>
  );
}
