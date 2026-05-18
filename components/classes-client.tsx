"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppBar, Badge, Card } from "@/components/ui";

type ClassSession = { id: string; title: string; description: string; scheduledAt: string; isLive: boolean };

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ClassesClient() {
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("classes");

  useEffect(() => {
    fetch("/api/public/classes")
      .then((r) => r.json())
      .then((d) => setClasses(d.classes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app">
      <AppBar active={tab} onNav={setTab} />
      <div className="app-scroll relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[260px] bg-gradient-to-b from-brand-100/60 via-white to-transparent dark:from-brand-950/40 dark:via-slate-950 dark:to-transparent"
      />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Badge variant="accent" className="mb-3">Live & Scheduled</Badge>
            <h1 className="text-4xl font-black tracking-tight">Classes</h1>
            <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-300">
              Browse upcoming sessions. You must sign in to join a classroom.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {loading ? (
            <Card className="p-6 text-sm text-slate-600 dark:text-slate-300 md:col-span-2">Loading classes…</Card>
          ) : classes.length === 0 ? (
            <Card className="p-6 text-sm text-slate-600 dark:text-slate-300 md:col-span-2">
              No classes yet. Check back soon — admins can schedule new sessions any time.
            </Card>
          ) : (
            classes.map((c) => (
              <Card key={c.id} className="group relative overflow-hidden p-6 transition hover:shadow-glow">
                <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-500 to-brand-700 opacity-70 group-hover:opacity-100" />
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-extrabold tracking-tight">{c.title}</h2>
                  {c.isLive ? (
                    <Badge className="bg-red-100 text-red-800 ring-red-200 dark:bg-red-900/40 dark:text-red-100 dark:ring-red-700/40">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="muted">Scheduled</Badge>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDate(c.scheduledAt)}</p>
                <p className="mt-3 text-sm text-slate-700 line-clamp-3 dark:text-slate-300">{c.description}</p>
                <Link
                  href={`/classes/${c.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
                >
                  Open classroom
                  <span aria-hidden>→</span>
                </Link>
              </Card>
            ))
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
