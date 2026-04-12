"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";

type Stat = {
  id: string;
  title: string;
  createdAt: string;
  totalQuestions: number;
  attempts: number;
  uniqueUsers: number;
  avgScore: number;
  maxScore: number;
};

export default function AdminAnalyticsClient() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics/quizzes")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error ?? "Failed to load");
        setStats(d.stats ?? []);
      })
      .catch((e) => setErr(e?.message ?? "Failed to load"));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Quiz analytics</h1>
          <p className="mt-2 text-slate-600">Attempts, average scores, and engagement.</p>
        </div>
        <Link href="/admin"><Button variant="secondary">Back</Button></Link>
      </div>

      {err && <Card className="mt-4 p-4 text-sm text-red-600">{err}</Card>}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {stats.map((s) => (
          <Card key={s.id} className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-extrabold">{s.title}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(s.createdAt).toLocaleString()}</p>
              </div>
              <Badge>{s.totalQuestions} Qs</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-xs text-slate-500">Attempts</p>
                <p className="text-xl font-black">{s.attempts}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-xs text-slate-500">Unique users</p>
                <p className="text-xl font-black">{s.uniqueUsers}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-xs text-slate-500">Avg score</p>
                <p className="text-xl font-black">{s.avgScore.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-xs text-slate-500">Max score</p>
                <p className="text-xl font-black">{s.maxScore}</p>
              </div>
            </div>

            <Link href={`/quizzes/${s.id}`} className="mt-4 inline-block text-sm font-semibold">
              Open quiz →
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
