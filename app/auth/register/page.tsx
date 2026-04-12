"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button, Card, Input } from "@/components/ui";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setLoading(false);
      setError(d?.error ?? "Registration failed.");
      return;
    }

    // Auto-login after registration
    const login = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (login?.error) {
      window.location.href = "/auth/signin";
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-black">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">Start learning and join live classes.</p>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-semibold">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-semibold">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="text-sm font-semibold">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account? <Link className="font-semibold" href="/auth/signin">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
