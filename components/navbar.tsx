"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui";
import { useTheme } from "@/components/theme-provider";

export function Navbar() {
  const { data } = useSession();
  const role = (data as any)?.user?.role;
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const close = () => setOpen(false);

  const navLinks = (
    <>
      <Link href="/classes" onClick={close}>Classes</Link>
      <Link href="/lessons" onClick={close}>Lessons</Link>
      <Link href="/quizzes" onClick={close}>Quizzes</Link>
      <Link href="/reports" onClick={close}>Report</Link>
      <Link href="/news" onClick={close}>News</Link>
      <Link href="/reminders" onClick={close}>Reminders</Link>
      {data && <Link href="/dashboard" onClick={close}>Dashboard</Link>}
      {data && role === "ADMIN" && <Link href="/admin" onClick={close}>Admin</Link>}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-slate-100" onClick={close}>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-600 text-white">ن</span>
          <span>Nasym-ur-Rahmah</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 md:flex">
          {navLinks}
        </nav>

        {/* Desktop auth */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={toggle}
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {!data ? (
            <>
              <Link href="/auth/signin" className="text-sm font-semibold">Sign in</Link>
              <Link href="/auth/register">
                <Button>Register</Button>
              </Link>
            </>
          ) : (
            <>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {data.user?.name} • {role}
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
            onClick={toggle}
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden absolute left-0 right-0 top-full z-50 border-b border-slate-100 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950">
          <nav className="flex flex-col gap-1 px-4 py-4">
            <Link href="/classes" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Classes</Link>
            <Link href="/lessons" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Lessons</Link>
            <Link href="/quizzes" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Quizzes</Link>
            <Link href="/reports" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Report</Link>
            <Link href="/news" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">News</Link>
            <Link href="/reminders" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Reminders</Link>
            {data && <Link href="/dashboard" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Dashboard</Link>}
            {data && role === "ADMIN" && <Link href="/admin" onClick={close} className="rounded-xl px-3 py-2 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Admin</Link>}
          </nav>
          <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
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
                <p className="text-sm text-slate-600 dark:text-slate-400">{data.user?.name} • {role}</p>
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
