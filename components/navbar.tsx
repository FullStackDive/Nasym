"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui";

export function Navbar() {
  const { data } = useSession();
  const role = (data as any)?.user?.role;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-slate-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-600 text-white">ن</span>
          <span>Noor</span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <Link href="/classes">Classes</Link>
          <Link href="/lessons">Lessons</Link>
          <Link href="/quizzes">Quizzes</Link>
          <Link href="/reports">Report</Link>
          <Link href="/news">News</Link>
          <Link href="/reminders">Reminders</Link>
          {data && <Link href="/dashboard">Dashboard</Link>}
          {data && role === "ADMIN" && <Link href="/admin">Admin</Link>}
        </nav>

        <div className="flex items-center gap-2">
          {!data ? (
            <>
              <Link href="/auth/signin" className="text-sm font-semibold">Sign in</Link>
              <Link href="/auth/register">
                <Button>Register</Button>
              </Link>
            </>
          ) : (
            <>
              <span className="hidden text-sm text-slate-600 md:block">
                {data.user?.name} • {role}
              </span>
              <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
