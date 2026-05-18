"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";
import { AdminShell } from "@/components/admin-client";

type Lesson = { id: string; title: string };
type QuizListItem = { id: string; title: string; description: string; createdAt: string; lesson?: Lesson | null; questions: { id: string }[] };

type Question = { prompt: string; options: string; correctIdx: number };

function questionsToEditor(questions: Array<{ prompt: string; options: string[]; correctIdx: number }>): Question[] {
  return questions.map((q) => ({
    prompt: q.prompt,
    options: q.options.join("\n"),
    correctIdx: q.correctIdx
  }));
}

export default function AdminQuizzesClient() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [items, setItems] = useState<QuizListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lessonId, setLessonId] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([{ prompt: "", options: "", correctIdx: 0 }]);

  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    const q = await fetch("/api/admin/quizzes").then((r) => r.json()).catch(() => ({}));
    setItems(q.quizzes ?? []);
    const l = await fetch("/api/public/lessons").then((r) => r.json()).catch(() => ({}));
    setLessons(l.lessons ?? []);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, []);

  function updateQ(i: number, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function addQ() {
    setQuestions((p) => [...p, { prompt: "", options: "", correctIdx: 0 }]);
  }

  function removeQ(i: number) {
    setQuestions((p) => p.filter((_, idx) => idx !== i));
  }

  function resetForm() {
    setSelectedId(null);
    setTitle("");
    setDescription("");
    setLessonId("");
    setQuestions([{ prompt: "", options: "", correctIdx: 0 }]);
    setErr(null);
  }

  async function load(id: string) {
    setErr(null);
    const res = await fetch(`/api/admin/quizzes/${id}`);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(d?.error ?? "Failed to load quiz");
      return;
    }
    const quiz = d.quiz as any;
    setSelectedId(quiz.id);
    setTitle(quiz.title);
    setDescription(quiz.description);
    setLessonId(quiz.lessonId ?? "");
    setQuestions(questionsToEditor(quiz.questions));
  }

  function buildPayload() {
    return {
      title,
      description,
      lessonId: lessonId || null,
      questions: questions.map((q) => ({
        prompt: q.prompt,
        options: q.options.split("\n").map((s) => s.trim()).filter(Boolean),
        correctIdx: q.correctIdx
      }))
    };
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    const res = await fetch("/api/admin/quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...buildPayload(), lessonId: lessonId || undefined })
    });

    setSaving(false);
    if (!res.ok) {
      setErr((await res.json().catch(() => ({})))?.error ?? "Create failed");
      return;
    }
    resetForm();
    await refresh();
  }

  async function update(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;

    setSaving(true);
    setErr(null);

    const res = await fetch(`/api/admin/quizzes/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload())
    });

    setSaving(false);
    if (!res.ok) {
      setErr((await res.json().catch(() => ({})))?.error ?? "Update failed");
      return;
    }
    await refresh();
  }

  async function remove() {
    if (!selectedId) return;
    if (!confirm("Delete this quiz? All questions and attempts will be removed.")) return;

    setDeleting(true);
    setErr(null);
    const res = await fetch(`/api/admin/quizzes/${selectedId}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      setErr((await res.json().catch(() => ({})))?.error ?? "Delete failed");
      return;
    }
    resetForm();
    await refresh();
  }

  return (
    <AdminShell active="quizzes">
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Quizzes manager</h1>
          <p className="mt-2 text-slate-600">Create, edit, and delete quizzes and questions.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-extrabold">{selectedId ? "Edit quiz" : "Create quiz"}</h2>
            {selectedId && <Badge>Editing</Badge>}
          </div>

          <form className="mt-4 space-y-3" onSubmit={selectedId ? update : create}>
            <div>
              <label className="text-sm font-semibold">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-semibold">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
            </div>
            <div>
              <label className="text-sm font-semibold">Link to lesson (optional)</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
              >
                <option value="">— None —</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2">
              <p className="text-sm font-semibold">Questions</p>
              <p className="text-xs text-slate-500">Options: one per line. correctIdx starts from 0.</p>
              <div className="mt-3 space-y-3">
                {questions.map((q, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-extrabold">Q{i + 1}</p>
                      {questions.length > 1 && (
                        <Button type="button" variant="ghost" onClick={() => removeQ(i)}>
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-semibold">Prompt</label>
                      <Input value={q.prompt} onChange={(e) => updateQ(i, { prompt: e.target.value })} required />
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-semibold">Options (one per line)</label>
                      <Textarea value={q.options} onChange={(e) => updateQ(i, { options: e.target.value })} rows={4} required />
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-semibold">Correct index (0..)</label>
                      <Input
                        value={String(q.correctIdx)}
                        onChange={(e) => updateQ(i, { correctIdx: Number(e.target.value || 0) })}
                        type="number"
                        min={0}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Button type="button" variant="secondary" onClick={addQ}>
                  Add question
                </Button>
              </div>
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <div className="flex flex-wrap gap-2">
              <Button className="flex-1" disabled={saving}>
                {saving ? "Saving..." : selectedId ? "Save changes" : "Create quiz"}
              </Button>
              {selectedId ? (
                <>
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    New quiz
                  </Button>
                  <Button type="button" variant="danger" onClick={remove} disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </>
              ) : null}
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Existing quizzes</h2>
          <p className="mt-2 text-sm text-slate-600">Click an item to edit.</p>

          <div className="mt-4 space-y-3">
            {items.map((q) => (
              <button
                key={q.id}
                onClick={() => load(q.id)}
                className={`w-full text-left rounded-2xl border p-4 transition ${
                  selectedId === q.id ? "border-brand-300 bg-brand-50" : "border-slate-100 hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold">{q.title}</p>
                  <Badge>{q.questions.length} Qs</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-700 line-clamp-2">{q.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {q.lesson ? `Lesson: ${q.lesson.title}` : "Not linked"} • {new Date(q.createdAt).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
    </AdminShell>
  );
}
