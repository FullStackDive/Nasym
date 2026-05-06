"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Icon, Avatar, AppBar } from "./ui";

type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIdx?: number; // only for teacher
};

type Quiz = {
  id: string;
  title: string;
  description: string;
  module: { id: string; title: string } | null;
  questions: QuizQuestion[];
  _count: { attempts: number };
};

type AttemptResult = {
  questionId: string;
  chosen: number;
  correct: boolean;
  correctIdx: number;
};

type AttemptRecord = {
  id: string;
  score: number;
  createdAt: string;
  user?: { id: string; name: string; email: string };
};

const QuizClient = ({ courseId, quizId }: { courseId: string; quizId: string }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [navTab, setNavTab] = useState("lessons");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Taking the quiz
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; correct: number; total: number; results: AttemptResult[] } | null>(null);

  // Teacher: add question form
  const [showQForm, setShowQForm] = useState(false);
  const [qPrompt, setQPrompt] = useState("");
  const [qOptions, setQOptions] = useState(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [addingQ, setAddingQ] = useState(false);
  const [qError, setQError] = useState("");

  const role = session?.user?.role;
  const canEdit = role === "ADMIN" || role === "TEACHER";
  const isStudent = role === "STUDENT";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, aRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/quizzes/${quizId}`),
        fetch(`/api/courses/${courseId}/quizzes/${quizId}/attempts`),
      ]);
      if (!qRes.ok) { setError("Quiz not found"); return; }
      const { quiz: q } = await qRes.json();
      setQuiz(q);
      setAnswers(new Array(q.questions.length).fill(-1));
      if (aRes.ok) setAttempts((await aRes.json()).attempts);
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, [courseId, quizId]);

  useEffect(() => { if (session) load(); }, [load, session]);

  const submitQuiz = async () => {
    if (!quiz) return;
    if (answers.some(a => a === -1)) { alert("Please answer all questions before submitting."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/quizzes/${quizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({ score: data.score, correct: data.correct, total: data.total, results: data.attempt.results });
        setAttempts(a => [{ id: data.attempt.id, score: data.score, createdAt: data.attempt.createdAt }, ...a]);
      }
    } finally { setSubmitting(false); }
  };

  const retake = () => {
    setResult(null);
    setAnswers(new Array(quiz?.questions.length ?? 0).fill(-1));
  };

  const addQuestion = async () => {
    setQError("");
    const opts = qOptions.filter(o => o.trim());
    if (!qPrompt.trim()) { setQError("Question prompt is required"); return; }
    if (opts.length < 2) { setQError("At least 2 options required"); return; }
    if (qCorrect >= opts.length) { setQError("Correct answer index is out of range"); return; }
    setAddingQ(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/quizzes/${quizId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: qPrompt, options: opts, correctIdx: qCorrect }),
      });
      if (res.ok) {
        const { question } = await res.json();
        setQuiz(q => q ? { ...q, questions: [...q.questions, question] } : q);
        setQPrompt(""); setQOptions(["", "", "", ""]); setQCorrect(0); setShowQForm(false);
      } else {
        const d = await res.json();
        setQError(d.error || "Failed to add question");
      }
    } finally { setAddingQ(false); }
  };

  const deleteQuestion = async (qId: string) => {
    const res = await fetch(`/api/courses/${courseId}/quizzes/${quizId}/questions/${qId}`, { method: "DELETE" });
    if (res.ok) setQuiz(q => q ? { ...q, questions: q.questions.filter(x => x.id !== qId) } : q);
  };

  const updateOption = (i: number, val: string) => setQOptions(o => { const n = [...o]; n[i] = val; return n; });

  if (loading) {
    return (
      <div className="app">
        <AppBar active={navTab} onNav={setNavTab} />
        <div className="app-scroll" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
          <div style={{ color:"var(--ink-3)" }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="app">
        <AppBar active={navTab} onNav={setNavTab} />
        <div className="app-scroll" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
          <div style={{ textAlign:"center" }}><div style={{ fontSize:40, marginBottom:12 }}>⚠️</div><div style={{ fontWeight:600 }}>{error || "Quiz not found"}</div></div>
        </div>
      </div>
    );
  }

  const bestScore = attempts.filter(a => !a.user || a.user.id === session?.user?.id).reduce((best, a) => Math.max(best, a.score), -1);

  return (
    <div className="app">
      <AppBar active={navTab} onNav={setNavTab} />
      <div className="app-scroll">
        <div style={{ maxWidth: 860, margin:"0 auto", padding:"32px 32px 64px" }}>

          <button className="btn btn-ghost btn-sm" style={{ marginBottom:18 }} onClick={() => router.push(`/courses/${courseId}?tab=quizzes`)}>
            ← Back to course
          </button>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div className="eyebrow">{quiz.module?.title ?? "Quiz"}</div>
            <h1 style={{ fontSize:30, fontWeight:800, margin:"8px 0 8px" }}>{quiz.title}</h1>
            <p style={{ color:"var(--ink-3)", margin:"0 0 10px", fontSize:14 }}>{quiz.description}</p>
            <div style={{ display:"flex", gap:14, fontSize:13, color:"var(--ink-3)" }}>
              <span><Icon name="check" size={13}/> {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}</span>
              <span><Icon name="users" size={13}/> {quiz._count.attempts} attempt{quiz._count.attempts !== 1 ? "s" : ""}</span>
              {bestScore >= 0 && !canEdit && <span style={{ color:"var(--brand-700)", fontWeight:700 }}><Icon name="trophy" size={13}/> Your best: {bestScore}%</span>}
            </div>
          </div>

          {/* ── Teacher view ── */}
          {canEdit && (
            <div style={{ display:"grid", gridTemplateColumns:"1.3fr .9fr", gap:24 }}>
              {/* Questions manager */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <h2 style={{ fontSize:16, fontWeight:700, margin:0 }}>Questions ({quiz.questions.length})</h2>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowQForm(v => !v)}>
                    <Icon name="plus" size={13}/> Add question
                  </button>
                </div>

                {showQForm && (
                  <div className="surface" style={{ padding:22, marginBottom:16 }}>
                    <div style={{ fontWeight:700, marginBottom:14 }}>New question</div>
                    {qError && <div style={{ color:"var(--danger,#e53e3e)", fontSize:13, marginBottom:10 }}>{qError}</div>}
                    <div style={{ marginBottom:12 }}>
                      <label className="label">Question prompt *</label>
                      <textarea className="input" rows={2} value={qPrompt} onChange={e => setQPrompt(e.target.value)} placeholder="What does the word 'Rahman' mean?" style={{ resize:"vertical" }} />
                    </div>
                    <div style={{ marginBottom:12 }}>
                      <label className="label">Answer options (min 2)</label>
                      {qOptions.map((opt, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={qCorrect === i}
                            onChange={() => setQCorrect(i)}
                            title="Mark as correct"
                            style={{ accentColor:"var(--brand-700)", width:16, height:16, flexShrink:0 }}
                          />
                          <input className="input" value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} style={{ flex:1 }} />
                        </div>
                      ))}
                      <button className="btn btn-ghost btn-sm" style={{ marginTop:4 }} onClick={() => setQOptions(o => [...o, ""])}>+ Add option</button>
                    </div>
                    <div style={{ fontSize:12, color:"var(--ink-3)", marginBottom:12 }}>
                      Select the radio button next to the correct answer.
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button className="btn btn-primary btn-sm" disabled={addingQ} onClick={addQuestion}>{addingQ ? "Adding…" : "Add question"}</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setShowQForm(false); setQError(""); }}>Cancel</button>
                    </div>
                  </div>
                )}

                {quiz.questions.length === 0 ? (
                  <div className="surface" style={{ padding:40, textAlign:"center", color:"var(--ink-3)" }}>No questions yet. Add one above.</div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {quiz.questions.map((q, idx) => (
                      <div key={q.id} className="surface" style={{ padding:18 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>{idx + 1}. {q.prompt}</div>
                            <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                              {(q.options as string[]).map((opt, oi) => (
                                <div key={oi} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
                                  <span style={{ width:20, height:20, borderRadius:"50%", background: oi === q.correctIdx ? "var(--brand-700)" : "var(--bg-soft)", border:"1.5px solid " + (oi === q.correctIdx ? "var(--brand-700)" : "var(--hairline)"), display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                    {oi === q.correctIdx && <Icon name="check" size={11} />}
                                  </span>
                                  <span style={{ color: oi === q.correctIdx ? "var(--brand-700)" : "var(--ink-2)", fontWeight: oi === q.correctIdx ? 600 : 400 }}>{opt}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <button className="btn btn-ghost btn-sm" style={{ color:"var(--danger,#e53e3e)", marginLeft:8, flexShrink:0 }} onClick={() => deleteQuestion(q.id)}>
                            <Icon name="trash" size={13}/>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attempts leaderboard */}
              <div>
                <h2 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>Student attempts ({attempts.length})</h2>
                <div className="surface" style={{ overflow:"hidden" }}>
                  {attempts.length === 0 ? (
                    <div style={{ padding:32, textAlign:"center", color:"var(--ink-3)", fontSize:14 }}>No attempts yet.</div>
                  ) : attempts.map((a, i) => (
                    <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px", borderTop: i > 0 ? "1px solid var(--hairline)" : undefined }}>
                      {a.user && <Avatar name={a.user.name} size={30} />}
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600 }}>{a.user?.name ?? "Student"}</div>
                        <div style={{ fontSize:11, color:"var(--ink-3)" }}>{new Date(a.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</div>
                      </div>
                      <div style={{ fontWeight:800, fontSize:16, color: a.score >= 70 ? "var(--brand-700)" : a.score >= 50 ? "var(--accent-600)" : "var(--danger,#e53e3e)" }}>
                        {a.score}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Student view ── */}
          {isStudent && (
            <div>
              {quiz.questions.length === 0 ? (
                <div className="surface" style={{ padding:48, textAlign:"center", color:"var(--ink-3)" }}>
                  This quiz has no questions yet. Check back later.
                </div>
              ) : result ? (
                /* Results screen */
                <div>
                  <div className="surface" style={{ padding:32, textAlign:"center", marginBottom:20 }}>
                    <div style={{ fontSize:56, marginBottom:8 }}>{result.score >= 70 ? "🎉" : result.score >= 50 ? "📚" : "💪"}</div>
                    <h2 style={{ fontSize:28, fontWeight:800, margin:"0 0 6px" }}>{result.score}%</h2>
                    <p style={{ color:"var(--ink-3)", margin:"0 0 18px" }}>{result.correct} out of {result.total} correct</p>
                    <button className="btn btn-secondary" onClick={retake}>Retake quiz</button>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {quiz.questions.map((q, idx) => {
                      const r = result.results.find(x => x.questionId === q.id);
                      if (!r) return null;
                      return (
                        <div key={q.id} className="surface" style={{ padding:20, borderLeft:`3px solid ${r.correct ? "var(--brand-700)" : "var(--danger,#e53e3e)"}` }}>
                          <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>{idx + 1}. {q.prompt}</div>
                          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                            {(q.options as string[]).map((opt, oi) => {
                              const chosen = oi === r.chosen;
                              const correct = oi === r.correctIdx;
                              const bg = correct ? "color-mix(in oklch, var(--brand-500) 14%, transparent)" : (chosen && !correct) ? "color-mix(in oklch, var(--danger,#e53e3e) 12%, transparent)" : "transparent";
                              return (
                                <div key={oi} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, padding:"6px 10px", borderRadius:8, background:bg }}>
                                  <span style={{ color: correct ? "var(--brand-700)" : (chosen && !correct) ? "var(--danger,#e53e3e)" : "var(--ink-3)", fontWeight:600, width:18 }}>
                                    {correct ? "✓" : (chosen && !correct) ? "✗" : ""}
                                  </span>
                                  <span style={{ color: correct ? "var(--brand-700)" : "var(--ink-2)", fontWeight: correct ? 600 : 400 }}>{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {attempts.length > 1 && (
                    <div style={{ marginTop:24 }}>
                      <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Your attempts</h3>
                      <div className="surface" style={{ overflow:"hidden" }}>
                        {attempts.map((a, i) => (
                          <div key={a.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 18px", borderTop: i > 0 ? "1px solid var(--hairline)" : undefined }}>
                            <span style={{ fontSize:13, color:"var(--ink-3)" }}>Attempt {attempts.length - i}</span>
                            <span style={{ fontSize:13, color:"var(--ink-3)" }}>{new Date(a.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}</span>
                            <span style={{ fontWeight:800, color: a.score >= 70 ? "var(--brand-700)" : a.score >= 50 ? "var(--accent-600)" : "var(--danger,#e53e3e)" }}>{a.score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Quiz form */
                <div>
                  {attempts.length > 0 && (
                    <div style={{ background:"color-mix(in oklch, var(--brand-500) 10%, transparent)", borderRadius:12, padding:"12px 18px", marginBottom:18, fontSize:13 }}>
                      You&apos;ve attempted this quiz {attempts.length} time{attempts.length !== 1 ? "s" : ""}. Best score: <b style={{ color:"var(--brand-700)" }}>{bestScore}%</b>
                    </div>
                  )}
                  <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    {quiz.questions.map((q, idx) => (
                      <div key={q.id} className="surface" style={{ padding:22 }}>
                        <div style={{ fontWeight:700, fontSize:15, marginBottom:14, lineHeight:1.5 }}>{idx + 1}. {q.prompt}</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {(q.options as string[]).map((opt, oi) => {
                            const selected = answers[idx] === oi;
                            return (
                              <button
                                key={oi}
                                onClick={() => setAnswers(a => { const n = [...a]; n[idx] = oi; return n; })}
                                style={{
                                  display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, border:`1.5px solid ${selected ? "var(--brand-700)" : "var(--hairline)"}`, background: selected ? "color-mix(in oklch, var(--brand-500) 10%, transparent)" : "var(--bg-soft)", cursor:"pointer", textAlign:"left", fontFamily:"inherit", color:"inherit", fontSize:14, fontWeight: selected ? 600 : 400, transition:"all 0.1s",
                                }}
                              >
                                <span style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${selected ? "var(--brand-700)" : "var(--hairline-2)"}`, background: selected ? "var(--brand-700)" : "transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                                  {selected && <span style={{ width:8, height:8, borderRadius:"50%", background:"white" }}/>}
                                </span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop:24, display:"flex", justifyContent:"flex-end" }}>
                    <button className="btn btn-primary" disabled={submitting || answers.some(a => a === -1)} onClick={submitQuiz} style={{ minWidth:140 }}>
                      {submitting ? "Submitting…" : <><Icon name="send" size={14}/> Submit quiz</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizClient;
