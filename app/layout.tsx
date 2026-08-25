import { Header } from "@/components/layout/Header";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReconFlow",
  description:
    "Match your books with Razorpay settlements and review only what needs attention.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-ink">
        <Header />
        {children}
      </body>
    </html>
  );
}
