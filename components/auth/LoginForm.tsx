"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    if (signInError) {
      setError("Could not sign in. Check your email and password.");
      setBusy(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="mx-auto w-full max-w-md p-6">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-muted">Use your business email to open ReconFlow.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(new FormData(event.currentTarget));
        }}
      >
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Business email</span>
          <Input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Password</span>
          <Input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error && <p className="text-sm text-alert">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        New to ReconFlow?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
