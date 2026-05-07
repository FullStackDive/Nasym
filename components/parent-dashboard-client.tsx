"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Icon, AppBar, Avatar } from "./ui";

type Child = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  enrolments: {
    id: string;
    enrolledAt: string;
    course: { id: string; title: string; slug: string };
  }[];
};

type Submission = {
  id: string;
  status: string;
  score: number | null;
  submittedAt: string;
  assignment: {
    id: string;
    title: string;
    maxPoints: number;
    dueAt: string | null;
    course: { id: string; title: string } | null;
  };
};

type Attempt = {
  id: string;
  score: number;
  createdAt: string;
  quiz: {
    id: string;
    title: string;
    course: { id: string; title: string } | null;
    _count: { questions: number };
  };
};

type Progress = {
  child: {
    id: string;
    name: string;
    email: string;
    enrolments: { enrolledAt: string; course: { id: string; title: string; slug: string } }[];
  };
  submissions: Submission[];
  attempts: Attempt[];
};

const statusColor = (s: string) => {
  if (s === "GRADED" || s === "RETURNED") return "var(--brand-700)";
  if (s === "LATE") return "#e53e3e";
  return "var(--ink-3)";
};

const ParentDashboardClient = () => {
  const { data: session } = useSession();
  const [navTab, setNavTab] = useState("dashboard");
  const [children, setChildren] = useState<Child[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progTab, setProgTab] = useState<"assignments" | "quizzes" | "courses">("courses");

  const loadChildren = useCallback(async () => {
    setLoadingChildren(true);
    try {
      const res = await fetch("/api/parent/children");
      if (res.ok) {
        const data = await res.json();
        setChildren(data.children);
        if (data.children.length === 1) setSelected(data.children[0].id);
      }
    } finally { setLoadingChildren(false); }
  }, []);

  const loadProgress = useCallback(async (childId: string) => {
    setLoadingProgress(true);
    setProgress(null);
    try {
      const res = await fetch(`/api/parent/children/${childId}/progress`);
      if (res.ok) setProgress(await res.json());
    } finally { setLoadingProgress(false); }
  }, []);

  useEffect(() => { loadChildren(); }, [loadChildren]);
  useEffect(() => { if (selected) loadProgress(selected); }, [selected, loadProgress]);

  const selectedChild = children.find(c => c.id === selected);

  return (
    <div className="app">
      <AppBar active={navTab} onNav={setNavTab} role="STUDENT" userName={session?.user?.name ?? undefined} />
      <div className="app-scroll">
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"36px 32px 80px" }}>
          <div className="eyebrow">Parent view</div>
          <h1 style={{ fontSize:30, fontWeight:800, letterSpacing:"-0.02em", margin:"6px 0 28px" }}>
            My Children&apos;s Progress
          </h1>

          {loadingChildren ? (
            <div style={{ color:"var(--ink-3)" }}>Loading…</div>
          ) : children.length === 0 ? (
            <div className="surface" style={{ padding:48, textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>👶</div>
              <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>No children linked</div>
              <p style={{ color:"var(--ink-3)", margin:0 }}>Contact the administrator to link your account to your child&apos;s profile.</p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"240px 1fr", gap:24 }}>
              {/* Child selector */}
              <div>
                <div style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-3)", marginBottom:12 }}>Children</div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => setSelected(child.id)}
                      style={{
                        display:"flex", alignItems:"center", gap:12, padding:"12px 14px",
                        background: selected === child.id ? "var(--brand-700)" : "var(--surface)",
                        color: selected === child.id ? "white" : "inherit",
                        border: selected === child.id ? "none" : "1px solid var(--hairline)",
                        borderRadius:12, cursor:"pointer", textAlign:"left", fontFamily:"inherit", width:"100%",
                      }}
                    >
                      <Avatar name={child.name} size={32} />
                      <div>
                        <div style={{ fontWeight:600, fontSize:13 }}>{child.name}</div>
                        <div style={{ fontSize:11, opacity:0.7 }}>{child.enrolments.length} course{child.enrolments.length !== 1 ? "s" : ""}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress panel */}
              <div>
                {!selected ? (
                  <div className="surface" style={{ padding:40, textAlign:"center", color:"var(--ink-3)" }}>Select a child to view their progress.</div>
                ) : loadingProgress ? (
                  <div style={{ color:"var(--ink-3)" }}>Loading progress…</div>
                ) : progress ? (
                  <div>
                    {/* Child header */}
                    <div className="surface" style={{ padding:"20px 24px", marginBottom:20, display:"flex", alignItems:"center", gap:16 }}>
                      <Avatar name={progress.child.name} size={48} />
                      <div>
                        <div style={{ fontWeight:800, fontSize:20 }}>{progress.child.name}</div>
                        <div style={{ fontSize:13, color:"var(--ink-3)" }}>{progress.child.email}</div>
                      </div>
                      <div style={{ marginLeft:"auto", display:"flex", gap:24 }}>
                        {[
                          ["Courses", progress.child.enrolments.length],
                          ["Assignments", progress.submissions.length],
                          ["Quizzes taken", progress.attempts.length],
                        ].map(([label, val]) => (
                          <div key={label as string} style={{ textAlign:"center" }}>
                            <div style={{ fontSize:22, fontWeight:800, color:"var(--brand-700)" }}>{val}</div>
                            <div style={{ fontSize:11, color:"var(--ink-3)" }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sub-tabs */}
                    <div style={{ display:"flex", gap:4, borderBottom:"1px solid var(--hairline)", marginBottom:20 }}>
                      {(["courses","assignments","quizzes"] as const).map(t => (
                        <button key={t} className="btn btn-ghost" style={{
                          borderRadius:"8px 8px 0 0",
                          borderBottom: progTab === t ? "2px solid var(--brand-700)" : "2px solid transparent",
                          color: progTab === t ? "var(--brand-700)" : "var(--ink-2)",
                          fontWeight: progTab === t ? 700 : 500,
                          paddingBottom:10,
                          textTransform:"capitalize",
                        }} onClick={() => setProgTab(t)}>
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Courses tab */}
                    {progTab === "courses" && (
                      progress.child.enrolments.length === 0 ? (
                        <div style={{ color:"var(--ink-3)", padding:24 }}>Not enrolled in any courses.</div>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                          {progress.child.enrolments.map(e => (
                            <div key={e.course.id} className="surface" style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:14 }}>
                              <div style={{ width:36, height:36, borderRadius:8, background:"var(--brand-700)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                                <Icon name="book" size={16} />
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontWeight:700, fontSize:14 }}>{e.course.title}</div>
                                <div style={{ fontSize:12, color:"var(--ink-3)" }}>Enrolled {new Date(e.enrolledAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {/* Assignments tab */}
                    {progTab === "assignments" && (
                      progress.submissions.length === 0 ? (
                        <div style={{ color:"var(--ink-3)", padding:24 }}>No assignments submitted yet.</div>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                          {progress.submissions.map(sub => (
                            <div key={sub.id} className="surface" style={{ padding:"16px 20px" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                                <div>
                                  <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{sub.assignment.title}</div>
                                  {sub.assignment.course && <div style={{ fontSize:12, color:"var(--ink-3)" }}>{sub.assignment.course.title}</div>}
                                  <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:2 }}>
                                    Submitted {new Date(sub.submittedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}
                                  </div>
                                </div>
                                <div style={{ textAlign:"right", flexShrink:0 }}>
                                  <span className="chip" style={{ fontSize:10, color:statusColor(sub.status), borderColor:"transparent", background:"color-mix(in oklch, currentColor 12%, transparent)" }}>
                                    {sub.status}
                                  </span>
                                  {sub.score !== null && (
                                    <div style={{ fontSize:14, fontWeight:800, color:"var(--brand-700)", marginTop:4 }}>
                                      {sub.score} / {sub.assignment.maxPoints}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {/* Quizzes tab */}
                    {progTab === "quizzes" && (
                      progress.attempts.length === 0 ? (
                        <div style={{ color:"var(--ink-3)", padding:24 }}>No quiz attempts yet.</div>
                      ) : (
                        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                          {progress.attempts.map(att => {
                            const pct = Math.round((att.score / att.quiz._count.questions) * 100);
                            return (
                              <div key={att.id} className="surface" style={{ padding:"16px 20px" }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <div>
                                    <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{att.quiz.title}</div>
                                    {att.quiz.course && <div style={{ fontSize:12, color:"var(--ink-3)" }}>{att.quiz.course.title}</div>}
                                    <div style={{ fontSize:12, color:"var(--ink-3)", marginTop:2 }}>
                                      {new Date(att.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}
                                    </div>
                                  </div>
                                  <div style={{ textAlign:"right" }}>
                                    <div style={{ fontSize:20, fontWeight:800, color: pct >= 70 ? "var(--brand-700)" : pct >= 50 ? "var(--gold-600, #b7791f)" : "#e53e3e" }}>
                                      {pct}%
                                    </div>
                                    <div style={{ fontSize:11, color:"var(--ink-3)" }}>{att.score}/{att.quiz._count.questions} correct</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardClient;
