"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
            owner_name: ownerName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setBusy(false);
        return;
      }

      if (data.user && data.session) {
        await supabase.from("businesses").upsert(
          {
            owner_user_id: data.user.id,
            name: businessName,
            owner_name: ownerName,
          },
          { onConflict: "owner_user_id" }
        );
        router.push("/");
        router.refresh();
        return;
      }

      setMessage("Account created. Please check your email to confirm your account.");
      setBusy(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create account.");
      setBusy(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md p-6">
      <h1 className="text-[28px] font-semibold tracking-tight text-ink">Create account</h1>
      <p className="mt-2 text-sm text-muted">One login for one business.</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Business name</span>
          <Input
            name="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Owner name</span>
          <Input
            name="ownerName"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Business email</span>
          <Input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Password</span>
          <Input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
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

