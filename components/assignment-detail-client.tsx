"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Icon, Avatar, AppBar } from "./ui";

type Assignment = {
  id: string;
  title: string;
  instructions: string;
  attachmentUrl: string | null;
  dueAt: string | null;
  maxPoints: number;
  isPublished: boolean;
  module: { id: string; title: string } | null;
  createdBy: { id: string; name: string };
  _count: { submissions: number };
};

type Submission = {
  id: string;
  text: string | null;
  fileUrl: string | null;
  status: string;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
  gradedBy: { id: string; name: string } | null;
  student?: { id: string; name: string; email: string };
};

const statusChip = (status: string, score: number | null, max: number) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    SUBMITTED: { bg: "color-mix(in oklch, var(--brand-500) 14%, transparent)", color: "var(--brand-800)", label: "Submitted" },
    LATE:      { bg: "color-mix(in oklch, var(--accent-500) 18%, transparent)", color: "var(--accent-700)", label: "Late" },
    GRADED:    { bg: "color-mix(in oklch, var(--brand-700) 14%, transparent)", color: "var(--brand-900)", label: score !== null ? `Graded · ${score}/${max}` : "Graded" },
    RETURNED:  { bg: "color-mix(in oklch, var(--c-mid) 14%, transparent)", color: "var(--brand-700)", label: score !== null ? `Returned · ${score}/${max}` : "Returned" },
  };
  const s = map[status] ?? { bg: "var(--bg-soft)", color: "var(--ink-3)", label: status };
  return <span className="chip" style={{ background: s.bg, color: s.color, borderColor: "transparent" }}>{s.label}</span>;
};

const AssignmentDetailClient = ({ courseId, assignmentId }: { courseId: string; assignmentId: string }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [navTab, setNavTab] = useState("lessons");
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [mySubmission, setMySubmission] = useState<Submission | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Student submit form
  const [submitText, setSubmitText] = useState("");
  const submitFileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Teacher grade
  const [grading, setGrading] = useState<string | null>(null); // submissionId
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [savingGrade, setSavingGrade] = useState(false);

  const role = session?.user?.role;
  const canEdit = role === "ADMIN" || role === "TEACHER";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, sRes] = await Promise.all([
        fetch(`/api/courses/${courseId}/assignments/${assignmentId}`),
        fetch(`/api/courses/${courseId}/assignments/${assignmentId}/submissions`),
      ]);
      if (!aRes.ok) { setError("Assignment not found"); return; }
      const { assignment: a, mySubmission: ms } = await aRes.json();
      setAssignment(a);
      setMySubmission(ms ?? null);
      if (sRes.ok) {
        const { submissions: subs } = await sRes.json();
        if (canEdit) setSubmissions(subs);
      }
    } catch { setError("Failed to load assignment"); }
    finally { setLoading(false); }
  }, [courseId, assignmentId, canEdit]);

  useEffect(() => { if (session) load(); }, [load, session]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const file = submitFileRef.current?.files?.[0];
    if (!submitText.trim() && !file) { setSubmitError("Please write a response or attach a file."); return; }
    setSubmitting(true);
    try {
      let res;
      if (file) {
        const form = new FormData();
        if (submitText.trim()) form.append("text", submitText);
        form.append("file", file);
        res = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}/submissions`, { method: "POST", body: form });
      } else {
        res = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}/submissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: submitText }),
        });
      }
      if (res.ok) {
        const { submission } = await res.json();
        setMySubmission(submission);
        setSubmitText(""); if (submitFileRef.current) submitFileRef.current.value = "";
      } else {
        const data = await res.json();
        setSubmitError(data.error || "Submission failed");
      }
    } finally { setSubmitting(false); }
  };

  const saveGrade = async (subId: string) => {
    setSavingGrade(true);
    const res = await fetch(`/api/courses/${courseId}/assignments/${assignmentId}/submissions/${subId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score: parseInt(gradeScore), feedback: gradeFeedback, status: "GRADED" }),
    });
    if (res.ok) {
      const { submission } = await res.json();
      setSubmissions(s => s.map(x => x.id === subId ? submission : x));
      setGrading(null); setGradeScore(""); setGradeFeedback("");
    }
    setSavingGrade(false);
  };

  if (loading) {
    return (
      <div className="app">
        <AppBar active={navTab} onNav={setNavTab} />
        <div className="app-scroll" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight: "60vh" }}>
          <div style={{ color:"var(--ink-3)" }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="app">
        <AppBar active={navTab} onNav={setNavTab} />
        <div className="app-scroll" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight: "60vh" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 600 }}>{error || "Assignment not found"}</div>
          </div>
        </div>
      </div>
    );
  }

  const isOverdue = assignment.dueAt && new Date(assignment.dueAt).getTime() < Date.now();

  return (
    <div className="app">
      <AppBar active={navTab} onNav={setNavTab} />
      <div className="app-scroll">
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 32px 64px" }}>

          {/* Back */}
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }} onClick={() => router.push(`/courses/${courseId}?tab=assignments`)}>
            ← Back to course
          </button>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div className="eyebrow">{assignment.module ? assignment.module.title : "Assignment"}</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, margin: "8px 0 10px" }}>{assignment.title}</h1>
            <div style={{ display:"flex", gap: 16, alignItems:"center", fontSize: 13, color:"var(--ink-3)" }}>
              <span><Icon name="user" size={13}/> {assignment.createdBy.name}</span>
              <span><Icon name="trophy" size={13}/> {assignment.maxPoints} points</span>
              {assignment.dueAt && (
                <span style={{ color: isOverdue ? "var(--danger, #e53e3e)" : "var(--ink-3)" }}>
                  <Icon name="clock" size={13}/> Due {new Date(assignment.dueAt).toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                  {isOverdue && " (overdue)"}
                </span>
              )}
              {canEdit && <span><Icon name="users" size={13}/> {assignment._count.submissions} submission{assignment._count.submissions !== 1 ? "s" : ""}</span>}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns: canEdit ? "1fr" : "1.4fr .8fr", gap: 24 }}>
            {/* Left: instructions */}
            <div>
              <div className="surface" style={{ padding: 26, marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin:"0 0 14px" }}>Instructions</h2>
                <div style={{ lineHeight: 1.75, whiteSpace:"pre-wrap", color:"var(--ink-2)" }}>{assignment.instructions}</div>
                {assignment.attachmentUrl && (
                  <a href={assignment.attachmentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: 18, display:"inline-flex" }}>
                    <Icon name="download" size={13}/> Download attachment
                  </a>
                )}
              </div>

              {/* Teacher: submissions list */}
              {canEdit && (
                <div className="surface" style={{ overflow:"hidden" }}>
                  <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--hairline)", fontWeight: 700, fontSize: 15 }}>
                    Submissions ({submissions.length})
                  </div>
                  {submissions.length === 0 ? (
                    <div style={{ padding: 32, textAlign:"center", color:"var(--ink-3)", fontSize: 14 }}>No submissions yet.</div>
                  ) : submissions.map((sub, i) => (
                    <div key={sub.id} style={{ padding:"16px 20px", borderTop: i > 0 ? "1px solid var(--hairline)" : undefined }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ display:"flex", gap: 10, alignItems:"center" }}>
                          <Avatar name={sub.student?.name ?? "?"} size={34} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{sub.student?.name}</div>
                            <div style={{ fontSize: 12, color:"var(--ink-3)" }}>
                              {new Date(sub.submittedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap: 8 }}>
                          {statusChip(sub.status, sub.score, assignment.maxPoints)}
                          <button className="btn btn-ghost btn-sm" onClick={() => { setGrading(sub.id); setGradeScore(sub.score?.toString() ?? ""); setGradeFeedback(sub.feedback ?? ""); }}>
                            {sub.status === "GRADED" ? "Edit grade" : "Grade"}
                          </button>
                        </div>
                      </div>

                      {/* Submission content */}
                      {sub.text && <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13, lineHeight: 1.65, color:"var(--ink-2)", background:"var(--bg-soft)", padding: "10px 14px", borderRadius: 10, whiteSpace:"pre-wrap" }}>{sub.text}</p>}
                      {sub.fileUrl && (
                        <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: 10, display:"inline-flex" }}>
                          <Icon name="download" size={13}/> Download submission
                        </a>
                      )}

                      {/* Existing feedback */}
                      {sub.feedback && grading !== sub.id && (
                        <div style={{ marginTop: 10, background:"color-mix(in oklch, var(--brand-500) 10%, transparent)", padding:"10px 14px", borderRadius: 10, fontSize: 13 }}>
                          <b>Feedback:</b> {sub.feedback}
                        </div>
                      )}

                      {/* Grade form */}
                      {grading === sub.id && (
                        <div style={{ marginTop: 14, padding: 16, background:"var(--bg-soft)", borderRadius: 12, border:"1px solid var(--hairline)" }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap: 10, marginBottom: 10 }}>
                            <div>
                              <label className="label">Score (max {assignment.maxPoints})</label>
                              <input className="input" type="number" min="0" max={assignment.maxPoints} value={gradeScore} onChange={e => setGradeScore(e.target.value)} />
                            </div>
                            <div>
                              <label className="label">Feedback (optional)</label>
                              <input className="input" value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} placeholder="Written comments…" />
                            </div>
                          </div>
                          <div style={{ display:"flex", gap: 8 }}>
                            <button className="btn btn-primary btn-sm" disabled={savingGrade || gradeScore === ""} onClick={() => saveGrade(sub.id)}>
                              {savingGrade ? "Saving…" : "Save grade"}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setGrading(null)}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: student submission panel */}
            {!canEdit && (
              <div>
                <div className="surface" style={{ padding: 22 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, margin:"0 0 14px" }}>Your submission</h2>

                  {mySubmission ? (
                    <div>
                      {statusChip(mySubmission.status, mySubmission.score, assignment.maxPoints)}
                      <div style={{ fontSize: 12, color:"var(--ink-3)", marginTop: 6 }}>
                        Submitted {new Date(mySubmission.submittedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                      </div>
                      {mySubmission.text && (
                        <p style={{ marginTop: 14, fontSize: 13, lineHeight: 1.65, color:"var(--ink-2)", background:"var(--bg-soft)", padding:"10px 14px", borderRadius: 10, whiteSpace:"pre-wrap" }}>
                          {mySubmission.text}
                        </p>
                      )}
                      {mySubmission.fileUrl && (
                        <a href={mySubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: 10, display:"inline-flex" }}>
                          <Icon name="download" size={13}/> Your submission file
                        </a>
                      )}
                      {mySubmission.feedback && (
                        <div style={{ marginTop: 14, padding:"12px 16px", background:"color-mix(in oklch, var(--brand-500) 10%, transparent)", borderRadius: 12, fontSize: 13 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>Teacher feedback</div>
                          <p style={{ margin: 0, color:"var(--ink-2)" }}>{mySubmission.feedback}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap: 12 }}>
                      {isOverdue && (
                        <div style={{ fontSize: 12, color:"var(--danger, #e53e3e)", fontWeight: 600 }}>⚠️ This assignment is overdue. Your submission will be marked late.</div>
                      )}
                      <div>
                        <label className="label">Response</label>
                        <textarea className="input" rows={5} placeholder="Write your answer here…" value={submitText} onChange={e => setSubmitText(e.target.value)} style={{ resize:"vertical" }} />
                      </div>
                      <div>
                        <label className="label">Attachment (optional)</label>
                        <input type="file" ref={submitFileRef} className="input" style={{ padding:"8px 12px" }} />
                      </div>
                      {submitError && <div style={{ color:"var(--danger, #e53e3e)", fontSize: 13 }}>{submitError}</div>}
                      <button className="btn btn-primary" type="submit" disabled={submitting}>
                        {submitting ? "Submitting…" : <><Icon name="send" size={14}/> Submit assignment</>}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetailClient;
