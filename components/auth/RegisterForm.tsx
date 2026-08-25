"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      options: {
        data: {
          business_name: String(formData.get("businessName") ?? ""),
          owner_name: String(formData.get("ownerName") ?? ""),
        },
      },
    });

    if (signUpError) {
      setError("Could not create the account. Please try again.");
      setBusy(false);
      return;
    }

    if (data.user && data.session) {
      await supabase.from("businesses").upsert(
        {
          owner_user_id: data.user.id,
          name: String(formData.get("businessName") ?? ""),
          owner_name: String(formData.get("ownerName") ?? ""),
        },
        { onConflict: "owner_user_id" }
      );
      router.push("/");
      router.refresh();
      return;
    }

    setMessage("Account created. Sign in with your business email.");
    setBusy(false);
  }

  return (
    <Card className="mx-auto w-full max-w-md p-6">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">Create account</h1>
      <p className="mt-2 text-sm text-muted">One login for one business.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(new FormData(event.currentTarget));
        }}
      >
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Business name</span>
          <Input name="businessName" required />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Owner name</span>
          <Input name="ownerName" required />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Business email</span>
          <Input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Password</span>
          <Input name="password" type="password" required minLength={6} autoComplete="new-password" />
        </label>
        {error && <p className="text-sm text-alert">{error}</p>}
        {message && <p className="text-sm text-match">{message}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
