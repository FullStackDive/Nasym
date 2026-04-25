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
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-brand-100/60 via-white to-transparent dark:from-brand-950/40 dark:via-slate-950 dark:to-transparent"
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2 md:items-center">
        <div className="hidden md:block">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
            <span className="text-lg font-bold">ن</span>
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight">
            Welcome back to{" "}
            <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
              Nasym-ur-Rahmah
            </span>
          </h1>
          <p className="mt-3 max-w-md text-slate-600 dark:text-slate-300">
            Continue your journey — pick up live classes, recorded lessons, and your daily reminders.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              Live classrooms with chat & video
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              Lessons, quizzes & progress tracking
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
              Daily ayah, hadith & reminders
            </li>
          </ul>
        </div>

        <div>
          <Card className="p-7 ring-1 ring-brand-100/70 dark:ring-brand-900/40">
            <h2 className="text-2xl font-black tracking-tight">Sign in</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Welcome back. Enter your details below.</p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="text-sm font-semibold">Email</label>
                <Input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="text-sm font-semibold">Password</label>
                <Input className="mt-1" value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" required />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-900/40">
                  {error}
                </p>
              )}

              <Button className="w-full" size="lg" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{" "}
              <Link className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300" href="/auth/register">
                Register
              </Link>
            </p>
          </Card>

          <Card className="mt-4 p-5 text-sm text-slate-700 dark:text-slate-300 ring-1 ring-accent-100/70 dark:ring-accent-900/30">
            <p className="font-semibold text-accent-800 dark:text-accent-200">Demo admin</p>
            <p className="mt-1 font-mono text-xs text-slate-700 dark:text-slate-300">admin@example.com / Admin123!</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Change the password after first login.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
