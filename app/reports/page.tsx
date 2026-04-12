"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";

type Report = { id: string; targetType: string; reason: string; status: string; createdAt: string };

export default function ReportsPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [targetType, setTargetType] = useState<"LESSON" | "QUIZ" | "USER">("LESSON");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [targetUserEmail, setTargetUserEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/reports");
    const d = await res.json().catch(() => ({}));
    if (res.ok) setItems(d.reports ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const payload: any = { targetType, reason, details };
    if (targetType === "USER") payload.targetUserEmail = targetUserEmail;

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(d?.error ?? "Report failed (sign in required).");
      return;
    }
    setReason(""); setDetails(""); setTargetUserEmail("");
    setMsg("Report submitted.");
    await refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Report / Help</h1>
          <p className="mt-2 text-slate-600">Report issues so admins can review and keep the community safe.</p>
        </div>
        <Link href="/dashboard"><Button variant="secondary">Dashboard</Button></Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-extrabold">Submit a report</h2>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <div>
              <label className="text-sm font-semibold">Target type</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
              >
                <option value="LESSON">Lesson</option>
                <option value="QUIZ">Quiz</option>
                <option value="USER">User</option>
              </select>
            </div>

            {targetType === "USER" && (
              <div>
                <label className="text-sm font-semibold">User email</label>
                <Input value={targetUserEmail} onChange={(e) => setTargetUserEmail(e.target.value)} type="email" required />
              </div>
            )}

            <div>
              <label className="text-sm font-semibold">Reason</label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
            </div>

            <div>
              <label className="text-sm font-semibold">Details (optional)</label>
              <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} />
            </div>

            {msg && <p className="text-sm text-slate-700">{msg}</p>}
            <Button>Submit</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Your reports</h2>
          <p className="mt-2 text-sm text-slate-600">Only you can see your submitted reports.</p>
          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <p className="text-sm text-slate-600">No reports yet.</p>
            ) : (
              items.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-extrabold">{r.reason}</p>
                    <Badge>{r.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{r.targetType} • {new Date(r.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
