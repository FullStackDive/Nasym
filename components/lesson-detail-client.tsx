"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Textarea, Input } from "@/components/ui";

type Lesson = { id: string; title: string; description: string; videoUrl: string; tags?: string | null; createdAt: string };
type Quiz = { id: string; title: string; description: string; createdAt: string };

export default function LessonDetailClient({ id }: { id: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/lessons/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setLesson(d.lesson ?? null);
        setQuizzes(d.quizzes ?? []);
      })
      .catch(() => {});

    // Load user progress (401 = not signed in, leave completed as null)
    fetch("/api/me/progress")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json().catch(() => ({}));
        const isCompleted = (d.progress ?? []).some((p: { lessonId: string }) => p.lessonId === id);
        setCompleted(isCompleted);
      })
      .catch(() => {});
  }, [id]);

  async function toggleComplete() {
    const method = completed ? "DELETE" : "POST";
    const res = await fetch(`/api/lessons/${id}/complete`, { method });
    if (!res.ok) return;
    setCompleted(!completed);
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "LESSON", lessonId: id, reason, details })
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d?.error ?? "Report failed (sign in required).");
      return;
    }
    setReason(""); setDetails("");
    setMsg("Thanks — your report has been submitted.");
  }

  if (!lesson) return <div className="mx-auto max-w-5xl px-4 py-10"><Card className="p-6">Loading…</Card></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{lesson.title}</h1>
          <p className="mt-2 text-slate-700">{lesson.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(lesson.tags ?? "").split(",").filter(Boolean).slice(0, 4).map((t) => <Badge key={t}>{t}</Badge>)}
          </div>
        </div>
        <Link href="/lessons"><Button variant="secondary">Back</Button></Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="aspect-video w-full bg-black">
            <iframe
              className="h-full w-full"
              src={lesson.videoUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-extrabold">Linked quizzes</h3>
            <p className="mt-2 text-sm text-slate-600">Test yourself after watching.</p>
            <div className="mt-4 space-y-3">
              {quizzes.length === 0 ? (
                <p className="text-sm text-slate-600">No quizzes linked yet.</p>
              ) : quizzes.map((q) => (
                <div key={q.id} className="rounded-2xl border border-slate-100 p-4">
                  <p className="font-extrabold">{q.title}</p>
                  <p className="mt-1 text-sm text-slate-700 line-clamp-2">{q.description}</p>
                  <Link className="mt-2 inline-block text-sm font-semibold" href={`/quizzes/${q.id}`}>Take quiz →</Link>
                </div>
              ))}
            </div>

            {completed !== null && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <Button
                  variant={completed ? "secondary" : "primary"}
                  className="w-full"
                  onClick={toggleComplete}
                >
                  {completed ? "Watched — click to undo" : "Mark as watched"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-6 p-6">
        <h3 className="font-extrabold">Report this lesson</h3>
        <p className="mt-2 text-sm text-slate-600">
          If you notice incorrect info, inappropriate content, or issues, report it for review.
        </p>
        <form className="mt-4 space-y-3" onSubmit={submitReport}>
          <div>
            <label className="text-sm font-semibold">Reason</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="e.g., Incorrect reference / Offensive comments" />
          </div>
          <div>
            <label className="text-sm font-semibold">Details (optional)</label>
            <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} />
          </div>
          {msg && <p className="text-sm text-slate-700">{msg}</p>}
          <Button>Submit report</Button>
        </form>
      </Card>
    </div>
  );
}
