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

    const login = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (login?.error) {
      window.location.href = "/auth/signin";
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-accent-100/40 via-white to-transparent dark:from-accent-950/30 dark:via-slate-950 dark:to-transparent"
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2 md:items-center">
        <div className="hidden md:block">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-gradient text-white shadow-soft">
            <span className="text-lg font-bold">ن</span>
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight">
            Begin your journey with{" "}
            <span className="bg-gradient-to-r from-accent-700 to-accent-500 bg-clip-text text-transparent">
              Nasym-ur-Rahmah
            </span>
          </h1>
          <p className="mt-3 max-w-md text-slate-600 dark:text-slate-300">
            Create a free student account to join live classes, watch lessons, take quizzes, and track your good habits.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Free for students — always
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Friendly, moderated community
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Sync progress across devices
            </li>
          </ul>
        </div>

        <div>
          <Card className="p-7 ring-1 ring-brand-100/70 dark:ring-brand-900/40">
            <h2 className="text-2xl font-black tracking-tight">Create account</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Start learning and join live classes.</p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="text-sm font-semibold">Name</label>
                <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
              </div>
              <div>
                <label className="text-sm font-semibold">Email</label>
                <Input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="text-sm font-semibold">Password</label>
                <Input className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="At least 6 characters" required minLength={6} />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/40">
                  {error}
                </p>
              )}

              <Button className="w-full" size="lg" disabled={loading}>
                {loading ? "Creating..." : "Create account"}
              </Button>
            </form>

            <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300" href="/auth/signin">
                Sign in
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
