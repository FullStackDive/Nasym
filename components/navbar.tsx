"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { Button, Logo } from "@/components/ui";

export function Navbar() {
  const { data } = useSession();
  const role = (data as any)?.user?.role;
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const linkCls =
    "text-sm font-semibold text-slate-700 hover:text-brand-700 transition-colors";

  const navLinks = (
    <>
      <Link href="/classes" onClick={close} className={linkCls}>Classes</Link>
      <Link href="/lessons" onClick={close} className={linkCls}>Lessons</Link>
      <Link href="/quizzes" onClick={close} className={linkCls}>Quizzes</Link>
      <Link href="/reports" onClick={close} className={linkCls}>Report</Link>
      <Link href="/blog" onClick={close} className={linkCls}>Blog</Link>
      <Link href="/news" onClick={close} className={linkCls}>News</Link>
      <Link href="/reminders" onClick={close} className={linkCls}>Reminders</Link>
      {data && <Link href="/dashboard" onClick={close} className={linkCls}>Dashboard</Link>}
      {data && role === "ADMIN" && <Link href="/admin" onClick={close} className={linkCls}>Admin</Link>}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100/70 bg-white/75 backdrop-blur-md shadow-[0_1px_0_rgba(16,185,129,0.06)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center font-extrabold text-slate-900" onClick={close}>
          <Logo size={36} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 md:flex">
          {navLinks}
        </nav>

        {/* Desktop auth */}
        <div className="hidden items-center gap-2 md:flex">
          {!data ? (
            <>
              <Link href="/auth/signin" className="text-sm font-semibold text-slate-700 hover:text-brand-700">Sign in</Link>
              <Link href="/auth/register">
                <Button>Register</Button>
              </Link>
            </>
          ) : (
            <>
              <span className="text-sm text-slate-600">
                {data.user?.name} <span className="text-slate-300">•</span>{" "}
                <span className="text-brand-700 dark:text-brand-300">{role}</span>
              </span>
              <Link href="/profile">
                <Button variant="ghost">Profile</Button>
              </Link>
              <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </Button>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden absolute left-0 right-0 top-full z-50 border-b border-slate-100 bg-white shadow-lg">
          <nav className="flex flex-col gap-1 px-4 py-4">
            <Link href="/classes" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50">Classes</Link>
            <Link href="/lessons" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50">Lessons</Link>
            <Link href="/quizzes" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50">Quizzes</Link>
            <Link href="/reports" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50">Report</Link>
            <Link href="/blog" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50">Blog</Link>
            <Link href="/news" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50">News</Link>
            <Link href="/reminders" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50">Reminders</Link>
            {data && <Link href="/dashboard" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50">Dashboard</Link>}
            {data && role === "ADMIN" && <Link href="/admin" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50">Admin</Link>}
          </nav>
          <div className="border-t border-slate-100 px-4 py-4">
            {!data ? (
              <div className="flex gap-2">
                <Link href="/auth/signin" onClick={close} className="flex-1">
                  <Button variant="secondary" className="w-full">Sign in</Button>
                </Link>
                <Link href="/auth/register" onClick={close} className="flex-1">
                  <Button className="w-full">Register</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-slate-600">{data.user?.name} • {role}</p>
                <div className="flex gap-2">
                  <Link href="/profile" onClick={close} className="flex-1">
                    <Button variant="ghost" className="w-full">Profile</Button>
                  </Link>
                  <Button variant="secondary" className="flex-1" onClick={() => { close(); signOut({ callbackUrl: "/" }); }}>
                    Sign out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
