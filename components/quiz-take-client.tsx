"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Textarea, Input, cn } from "@/components/ui";

type Question = { id: string; prompt: string; options: string[] };
type Quiz = { id: string; title: string; description: string; lesson?: { id: string; title: string } | null; questions: Question[] };

type FeedbackItem = { questionId: string; yourIdx: number; correctIdx: number; correct: boolean };
type Result = { score: number; total: number; feedback: FeedbackItem[] };

type Stat = { totalQuestions: number; attempts: number; uniqueUsers: number; avgScore: number; maxScore: number };
type LeaderRow = { rank: number; name: string; score: number; total: number };
type Attempt = { id: string; score: number; createdAt: string };

export default function QuizTakeClient({ id }: { id: string }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  // analytics
  const [stats, setStats] = useState<Stat | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [myAttempts, setMyAttempts] = useState<Attempt[]>([]);
  const [myAttemptsError, setMyAttemptsError] = useState<string | null>(null);

  // report
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function loadAnalytics() {
    fetch(`/api/public/quizzes/${id}/stats`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});

    fetch(`/api/public/quizzes/${id}/leaderboard`)
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard ?? []))
      .catch(() => {});

    fetch(`/api/quizzes/${id}/my-attempts`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.error ?? "Sign in to see your attempts.");
        setMyAttempts(d.attempts ?? []);
        setMyAttemptsError(null);
      })
      .catch((e) => setMyAttemptsError(e?.message ?? "Sign in to see your attempts."));
  }

  useEffect(() => {
    fetch(`/api/public/quizzes/${id}`)
      .then((r) => r.json())
      .then((d) => setQuiz(d.quiz ?? null))
      .catch(() => setError("Could not load quiz."));
  }, [id]);

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function setAnswer(qid: string, idx: number) {
    if (result) return; // locked after submission
    setAnswers((p) => ({ ...p, [qid]: idx }));
  }

  async function submit() {
    setError(null);
    const res = await fetch(`/api/quizzes/${id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answersByQuestionId: answers })
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(d?.error ?? "Submit failed (sign in required).");
      return;
    }
    setResult(d.result);
    loadAnalytics();
  }

  function tryAgain() {
    setResult(null);
    setAnswers({});
    setError(null);
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "QUIZ", quizId: id, reason, details })
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(d?.error ?? "Report failed (sign in required).");
      return;
    }
    setReason(""); setDetails("");
    setMsg("Thanks — your report has been submitted.");
  }

  if (error) return <div className="mx-auto max-w-4xl px-4 py-10"><Card className="p-6">{error}</Card></div>;
  if (!quiz) return <div className="mx-auto max-w-4xl px-4 py-10"><Card className="p-6">Loading…</Card></div>;

  const total = quiz.questions.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">{quiz.title}</h1>
          <p className="mt-2 text-slate-700">{quiz.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {quiz.lesson ? <Badge>Lesson: {quiz.lesson.title}</Badge> : <Badge>Quiz</Badge>}
            <Badge>{total} questions</Badge>
          </div>
        </div>
        <Link href="/quizzes"><Button variant="secondary">Back</Button></Link>
      </div>

      {result && (
        <Card className={cn("mt-6 p-6", result.score === result.total ? "bg-green-50 border-green-200" : result.score >= result.total / 2 ? "bg-brand-50 border-brand-200" : "bg-red-50 border-red-200")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-black">Score: {result.score} / {result.total}</p>
              <p className="mt-1 text-sm text-slate-600">
                {result.score === result.total ? "Excellent! Perfect score!" : result.score >= result.total / 2 ? "Good effort — review the missed questions below." : "Keep studying — you can do it! Review the answers below."}
              </p>
            </div>
            <Button variant="secondary" onClick={tryAgain}>Try again</Button>
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {quiz.questions.map((q, idx) => {
            const fb = result?.feedback.find((f) => f.questionId === q.id);
            return (
              <Card key={q.id} className={cn("p-6", fb && (fb.correct ? "border-green-300" : "border-red-300"))}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-extrabold">Q{idx + 1}. {q.prompt}</p>
                  {fb && (
                    <Badge className={fb.correct ? "bg-green-100 text-green-800 shrink-0" : "bg-red-100 text-red-800 shrink-0"}>
                      {fb.correct ? "Correct" : "Incorrect"}
                    </Badge>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  {q.options.map((opt, i) => {
                    const isCorrect = fb && i === fb.correctIdx;
                    const isWrong = fb && i === fb.yourIdx && !fb.correct;
                    return (
                      <label
                        key={i}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-2xl border p-4",
                          isCorrect ? "border-green-400 bg-green-50" : isWrong ? "border-red-400 bg-red-50" : "border-slate-100",
                          result && "cursor-default"
                        )}
                      >
                        <span className="text-sm font-semibold">{opt}</span>
                        <input
                          type="radio"
                          name={q.id}
                          className="h-5 w-5 accent-green-600"
                          checked={answers[q.id] === i}
                          onChange={() => setAnswer(q.id, i)}
                          disabled={!!result}
                        />
                      </label>
                    );
                  })}
                </div>
                {fb && !fb.correct && (
                  <p className="mt-3 text-sm text-slate-600">
                    Correct answer: <span className="font-semibold">{q.options[fb.correctIdx]}</span>
                  </p>
                )}
              </Card>
            );
          })}

          <div className="flex flex-wrap items-center gap-3">
            {!result ? (
              <Button onClick={submit}>Submit answers</Button>
            ) : (
              <Button variant="secondary" onClick={tryAgain}>Try again</Button>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <Card className="p-6">
            <h3 className="font-extrabold">Report this quiz</h3>
            <form className="mt-4 space-y-3" onSubmit={submitReport}>
              <div>
                <label className="text-sm font-semibold">Reason</label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold">Details (optional)</label>
                <Textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} />
              </div>
              {msg && <p className="text-sm text-slate-700">{msg}</p>}
              <Button variant="secondary">Submit report</Button>
            </form>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-extrabold">Quiz analytics</h3>
            {!stats ? (
              <p className="mt-2 text-sm text-slate-600">Loading…</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-500">Attempts</p>
                  <p className="text-xl font-black">{stats.attempts}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-500">Unique users</p>
                  <p className="text-xl font-black">{stats.uniqueUsers}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-500">Avg score</p>
                  <p className="text-xl font-black">{stats.avgScore.toFixed(1)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-xs text-slate-500">Max score</p>
                  <p className="text-xl font-black">{stats.maxScore}</p>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-extrabold">Leaderboard</h3>
            <p className="mt-2 text-xs text-slate-500">Best score per user (names are masked).</p>
            <div className="mt-4 space-y-2">
              {leaderboard.length === 0 ? (
                <p className="text-sm text-slate-600">No attempts yet.</p>
              ) : leaderboard.map((row) => (
                <div key={row.rank} className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 text-sm">
                  <span className="font-semibold">#{row.rank} {row.name}</span>
                  <Badge>{row.score}/{row.total}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-extrabold">Your attempts</h3>
            {myAttemptsError ? (
              <p className="mt-2 text-sm text-slate-600">{myAttemptsError}</p>
            ) : (
              <div className="mt-4 space-y-2">
                {myAttempts.length === 0 ? (
                  <p className="text-sm text-slate-600">No attempts yet.</p>
                ) : myAttempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-3 text-sm">
                    <span className="text-slate-700">{new Date(a.createdAt).toLocaleString()}</span>
                    <Badge>{a.score}/{total}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
