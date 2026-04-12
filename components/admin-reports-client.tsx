"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";

type Report = {
  id: string;
  targetType: "LESSON" | "QUIZ" | "USER";
  reason: string;
  details?: string | null;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  reporter: { email: string; name: string };
  lesson?: { id: string; title: string } | null;
  quiz?: { id: string; title: string } | null;
  targetUserId?: string | null;
};

export default function AdminReportsClient() {
  const [items, setItems] = useState<Report[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/reports");
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(d?.error ?? "Failed to load");
      return;
    }
    setItems(d.reports ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function setStatus(id: string, status: "OPEN" | "RESOLVED") {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (!res.ok) return;
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Moderation / Reports</h1>
          <p className="mt-2 text-slate-600">Review reports and mark them resolved.</p>
        </div>
        <Link href="/admin"><Button variant="secondary">Back</Button></Link>
      </div>

      {err && <Card className="mt-4 p-4 text-sm text-red-600">{err}</Card>}

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <Card className="p-6 text-sm text-slate-600">No reports.</Card>
        ) : (
          items.map((r) => (
            <Card key={r.id} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={r.status === "OPEN" ? "" : "bg-slate-100 text-slate-800"}>{r.status}</Badge>
                  <p className="font-extrabold">{r.reason}</p>
                </div>
                <div className="flex gap-2">
                  {r.status === "OPEN" ? (
                    <Button onClick={() => setStatus(r.id, "RESOLVED")}>Resolve</Button>
                  ) : (
                    <Button variant="secondary" onClick={() => setStatus(r.id, "OPEN")}>Re-open</Button>
                  )}
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{r.details || "—"}</p>
              <p className="mt-3 text-xs text-slate-500">
                Target: {r.targetType}
                {r.lesson ? ` • Lesson: ${r.lesson.title}` : ""}
                {r.quiz ? ` • Quiz: ${r.quiz.title}` : ""}
                {" • "}Reporter: {r.reporter.name} ({r.reporter.email})
                {" • "}Created: {new Date(r.createdAt).toLocaleString()}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
