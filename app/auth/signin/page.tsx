"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Invalid email or password.");
    else window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <Card className="p-6">
        <h1 className="text-2xl font-black">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">Welcome back.</p>

        <form className="mt-6 space-y-3" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-semibold">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label className="text-sm font-semibold">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Don&apos;t have an account? <Link className="font-semibold" href="/auth/register">Register</Link>
        </p>
      </Card>

      <Card className="mt-4 p-5 text-sm text-slate-700">
        <p className="font-semibold">Demo admin:</p>
        <p>admin@example.com / Admin123!</p>
        <p className="mt-2 text-xs text-slate-500">Change the password after first login.</p>
      </Card>
    </div>
  );
}
