"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Badge, Button, Card } from "@/components/ui";

type Habit = { key: string; label: string };

const habits: Habit[] = [
  { key: "salah", label: "Pray 5 daily Salah" },
  { key: "quran", label: "Read Qur'an (10 minutes)" },
  { key: "dhikr", label: "Morning/Evening adhkar" },
  { key: "good", label: "One good deed / help someone" }
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function RemindersPage() {
  const { status } = useSession();
  const isAuth = status === "authenticated";
  const storageKey = useMemo(() => `noor-habits:${todayKey()}`, []);
  const [state, setState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (isAuth) {
      fetch("/api/reminders/today")
        .then((r) => r.json())
        .then((d) => { setState((d.habits as Record<string, boolean>) ?? {}); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(raw ? JSON.parse(raw) : {});
      setLoading(false);
    }
  }, [status, isAuth, storageKey]);

  async function toggle(key: string) {
    const next = { ...state, [key]: !state[key] };
    setState(next);
    if (isAuth) {
      await fetch("/api/reminders/today", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habits: next })
      });
    } else {
      localStorage.setItem(storageKey, JSON.stringify(next));
    }
  }

  async function reset() {
    setState({});
    if (isAuth) {
      await fetch("/api/reminders/today", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habits: {} })
      });
    } else {
      localStorage.removeItem(storageKey);
    }
  }

  const done = habits.filter((h) => state[h.key]).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Daily Reminders</h1>
          <p className="mt-2 text-slate-600">
            {isAuth
              ? "Your habits are synced to your account."
              : "Stored on this device — sign in to sync across devices."}
          </p>
        </div>
        <Badge>{done}/{habits.length} done</Badge>
      </div>

      <Card className="mt-6 p-6">
        {loading ? (
          <p className="text-sm text-slate-600">Loading…</p>
        ) : (
          <div className="space-y-3">
            {habits.map((h) => (
              <label key={h.key} className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 p-4">
                <span className="font-semibold">{h.label}</span>
                <input type="checkbox" checked={!!state[h.key]} onChange={() => toggle(h.key)} className="h-5 w-5 accent-green-600" />
              </label>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={reset}>Reset</Button>
          <Link className="text-sm font-semibold text-brand-800" href="/classes">Join a class →</Link>
        </div>
      </Card>
    </div>
  );
}
