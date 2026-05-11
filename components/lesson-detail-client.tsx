"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon, Avatar, AppBar } from "./ui";

type Lesson = { id: string; title: string; description: string; videoUrl: string; tags?: string | null; createdAt: string };
type Quiz = { id: string; title: string; description: string; createdAt: string };
type Comment = { id: string; body: string; createdAt: string; userId: string; user: { id: string; name: string; role: string } };

type TabKey = "notes" | "transcript" | "discussion" | "quiz";

function isEmbedUrl(u: string) {
  return /youtu\.?be|vimeo\.com|player\./i.test(u);
}

function toEmbed(u: string) {
  try {
    const url = new URL(u);
    if (/youtu\.be$/i.test(url.host)) {
      const id = url.pathname.replace(/^\//, "");
      return `https://www.youtube.com/embed/${id}`;
    }
    if (/youtube\.com$/i.test(url.host) && url.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${url.searchParams.get("v")}`;
    }
    return u;
  } catch {
    return u;
  }
}

function parseTags(t?: string | null): string[] {
  return (t ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

function fmtTime(t: number) {
  if (!isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function fmtAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(d / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function LessonDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("notes");

  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const [offlineSaved, setOfflineSaved] = useState(false);
  const [savingOffline, setSavingOffline] = useState(false);
  const [offlineMsg, setOfflineMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const embed = lesson ? isEmbedUrl(lesson.videoUrl) : false;

  useEffect(() => {
    fetch(`/api/public/lessons/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setLesson(d.lesson ?? null);
        setQuizzes(d.quizzes ?? []);
      })
      .catch(() => {});

    fetch("/api/me/progress")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json().catch(() => ({}));
        const isCompleted = (d.progress ?? []).some((p: { lessonId: string }) => p.lessonId === id);
        setCompleted(isCompleted);
      })
      .catch(() => {});

    loadComments();

    const saved = localStorage.getItem(`lesson:${id}:notes`);
    if (saved) setNotes(saved);

    if ("caches" in window) {
      caches.has(`lesson-${id}`).then(setOfflineSaved).catch(() => {});
    }

    const pos = parseFloat(localStorage.getItem(`lesson:${id}:position`) || "0");
    if (pos > 0) setPosition(pos);
  }, [id]);

  function loadComments() {
    fetch(`/api/lessons/${id}/comments`)
      .then(r => r.ok ? r.json() : { comments: [] })
      .then(d => setComments(d.comments ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (position > 0 && Math.abs(v.currentTime - position) > 1) {
      v.currentTime = position;
    }
  }, [position, lesson]);

  async function toggleComplete() {
    if (!userId) { router.push("/auth/signin?callbackUrl=" + encodeURIComponent(`/lessons/${id}`)); return; }
    const method = completed ? "DELETE" : "POST";
    const res = await fetch(`/api/lessons/${id}/complete`, { method });
    if (!res.ok) return;
    setCompleted(!completed);
  }

  function startLesson() {
    setActiveTab("notes");
    if (embed) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const v = videoRef.current;
    if (v) {
      v.play().catch(() => {});
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function saveOffline() {
    if (!lesson) return;
    setOfflineMsg(null);
    if (embed) {
      setOfflineMsg("Offline saving is not available for embedded videos (YouTube/Vimeo).");
      return;
    }
    if (!("caches" in window)) {
      setOfflineMsg("Your browser does not support offline caching.");
      return;
    }
    setSavingOffline(true);
    try {
      const cache = await caches.open(`lesson-${id}`);
      await cache.add(lesson.videoUrl);
      setOfflineSaved(true);
      setOfflineMsg("Saved for offline.");
    } catch {
      setOfflineMsg("Could not save — the video host may not allow offline caching.");
    } finally {
      setSavingOffline(false);
    }
  }

  async function removeOffline() {
    setSavingOffline(true);
    try {
      await caches.delete(`lesson-${id}`);
      setOfflineSaved(false);
      setOfflineMsg("Offline copy removed.");
    } finally {
      setSavingOffline(false);
    }
  }

  function saveNotes() {
    localStorage.setItem(`lesson:${id}:notes`, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 1500);
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    setCommentError(null);
    if (!userId) { router.push("/auth/signin?callbackUrl=" + encodeURIComponent(`/lessons/${id}`)); return; }
    if (!newComment.trim()) return;
    setPostingComment(true);
    const res = await fetch(`/api/lessons/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newComment.trim() })
    });
    setPostingComment(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setCommentError(d.error ?? "Could not post comment");
      return;
    }
    setNewComment("");
    loadComments();
  }

  async function deleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/lessons/${id}/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) loadComments();
  }

  if (!lesson) {
    return (
      <div className="app">
        <AppBar active="lessons" />
        <div className="app-scroll">
          <div style={{ maxWidth: 1180, margin: "0 auto", padding: "80px 32px", color: "var(--ink-3)" }}>Loading lesson…</div>
        </div>
      </div>
    );
  }

  const tags = parseTags(lesson.tags);

  return (
    <div className="app">
      <AppBar active="lessons" />
      <div className="app-scroll">
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 32px 56px" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push("/lessons")} style={{ marginBottom: 18 }}>← All lessons</button>

          <div style={{ display:"grid", gridTemplateColumns:"1.5fr .9fr", gap: 28 }}>
            <div>
              <div style={{ position:"relative", borderRadius: 22, overflow:"hidden", aspectRatio:"16/9", background: "#000" }}>
                {embed ? (
                  <iframe
                    src={toEmbed(lesson.videoUrl)}
                    title={lesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: "100%", height: "100%", border: 0 }}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={lesson.videoUrl}
                    controls
                    preload="metadata"
                    style={{ width: "100%", height: "100%", display: "block" }}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                    onTimeUpdate={(e) => {
                      const t = e.currentTarget.currentTime;
                      setPosition(t);
                      if (Math.floor(t) % 5 === 0) localStorage.setItem(`lesson:${id}:position`, String(t));
                    }}
                    onEnded={() => {
                      setPlaying(false);
                      localStorage.removeItem(`lesson:${id}:position`);
                      if (completed === false) toggleComplete();
                    }}
                  />
                )}
              </div>

              {!embed && (
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", color: "var(--ink-3)", fontSize: 12 }}>
                  <span>{fmtTime(position)} / {fmtTime(duration)}</span>
                  <span>{playing ? "Playing" : position > 0 ? "Paused" : "Ready"}</span>
                </div>
              )}

              <div style={{ marginTop: 22 }}>
                {tags[0] && <span className="chip chip-mint">{tags[0]}</span>}
                <h1 className="serif" style={{ fontSize: 38, fontWeight: 500, letterSpacing:"-0.02em", margin: "12px 0 8px", lineHeight: 1.1 }}>{lesson.title}</h1>
                <p className="serif" style={{ marginTop: 14, fontSize: 16, lineHeight: 1.65, color:"var(--ink-2)", fontWeight: 400 }}>
                  {lesson.description}
                </p>

                <div style={{ marginTop: 22, display:"flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn btn-primary" onClick={startLesson}>
                    <Icon name="play" size={14}/> {position > 5 ? "Resume" : "Start"} lesson
                  </button>
                  <button className="btn btn-secondary" onClick={offlineSaved ? removeOffline : saveOffline} disabled={savingOffline}>
                    <Icon name="download" size={14}/> {savingOffline ? "Saving…" : offlineSaved ? "Saved offline ✓" : "Save offline"}
                  </button>
                  <button className={"btn " + (completed ? "btn-secondary" : "btn-ghost")} onClick={toggleComplete}>
                    <Icon name="check" size={14}/> {completed ? "Watched ✓" : "Mark watched"}
                  </button>
                </div>
                {offlineMsg && <p style={{ marginTop: 10, fontSize: 12, color: "var(--ink-3)" }}>{offlineMsg}</p>}
              </div>

              <div style={{ marginTop: 30, borderBottom: "1px solid var(--hairline)", display:"flex", gap: 4, flexWrap: "wrap" }}>
                {(
                  [
                    ["notes", "Notes"],
                    ["transcript", "Transcript"],
                    ["discussion", `Discussion · ${comments.length}`],
                    ["quiz", `Quiz · ${quizzes.length}`],
                  ] as [TabKey, string][]
                ).map(([k, label]) => (
                  <button key={k} onClick={() => setActiveTab(k)} className="btn btn-ghost btn-sm" style={{ borderRadius: 0, borderBottom: activeTab === k ? "2px solid var(--brand-700)" : "2px solid transparent", color: activeTab === k ? "var(--brand-700)" : "var(--ink-3)", padding: "11px 14px" }}>{label}</button>
                ))}
              </div>

              <div style={{ paddingTop: 22 }}>
                {activeTab === "notes" && (
                  <div>
                    <h3 className="serif" style={{ margin:"0 0 10px", fontSize: 20, fontWeight: 500 }}>Your notes</h3>
                    <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "0 0 12px" }}>Saved locally on this device.</p>
                    <textarea
                      className="textarea"
                      rows={10}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Write what you learned, ayāt to memorise, du'ā to make…"
                      style={{ width: "100%", fontSize: 14 }}
                    />
                    <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                      <button className="btn btn-primary btn-sm" onClick={saveNotes}>Save notes</button>
                      {notesSaved && <span style={{ fontSize: 12, color: "var(--brand-700)" }}>Saved ✓</span>}
                    </div>
                  </div>
                )}

                {activeTab === "transcript" && (
                  <div>
                    <h3 className="serif" style={{ margin:"0 0 10px", fontSize: 20, fontWeight: 500 }}>Transcript</h3>
                    {lesson.description ? (
                      <div className="serif" style={{ whiteSpace: "pre-wrap", fontSize: 16, lineHeight: 1.7, color: "var(--ink-2)" }}>
                        {lesson.description}
                      </div>
                    ) : (
                      <p style={{ color: "var(--ink-3)", fontSize: 14 }}>No transcript available yet for this lesson.</p>
                    )}
                  </div>
                )}

                {activeTab === "discussion" && (
                  <div>
                    <h3 className="serif" style={{ margin:"0 0 10px", fontSize: 20, fontWeight: 500 }}>Discussion</h3>
                    <form onSubmit={postComment} style={{ marginBottom: 18 }}>
                      <textarea
                        className="textarea"
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={userId ? "Share a thought or question…" : "Sign in to join the discussion"}
                        disabled={!userId}
                        style={{ width: "100%", fontSize: 14 }}
                      />
                      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        {commentError && <span style={{ fontSize: 12, color: "var(--accent-700)" }}>{commentError}</span>}
                        <span style={{ flex: 1 }} />
                        {userId ? (
                          <button type="submit" className="btn btn-primary btn-sm" disabled={postingComment || !newComment.trim()}>{postingComment ? "Posting…" : "Post comment"}</button>
                        ) : (
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => router.push("/auth/signin?callbackUrl=" + encodeURIComponent(`/lessons/${id}`))}>Sign in to comment</button>
                        )}
                      </div>
                    </form>

                    {comments.length === 0 ? (
                      <p style={{ color: "var(--ink-3)", fontSize: 14 }}>No comments yet — be the first to share.</p>
                    ) : comments.map((c) => (
                      <div key={c.id} style={{ display: "flex", gap: 12, padding: "14px 0", borderTop: "1px solid var(--hairline)" }}>
                        <Avatar name={c.user.name} size={36} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                            <b style={{ fontSize: 14 }}>{c.user.name}</b>
                            {c.user.role !== "STUDENT" && <span className="chip chip-mint" style={{ fontSize: 10 }}>{c.user.role}</span>}
                            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{fmtAgo(c.createdAt)}</span>
                          </div>
                          <p className="serif" style={{ margin: "4px 0 0", fontSize: 15, color: "var(--ink-2)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{c.body}</p>
                        </div>
                        {(c.userId === userId) && (
                          <button onClick={() => deleteComment(c.id)} className="btn btn-ghost btn-sm" style={{ color: "var(--accent-700)" }} aria-label="Delete">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "quiz" && (
                  <div>
                    <h3 className="serif" style={{ margin:"0 0 10px", fontSize: 20, fontWeight: 500 }}>Linked quizzes</h3>
                    {quizzes.length === 0 ? (
                      <p style={{ color: "var(--ink-3)", fontSize: 14 }}>No quizzes linked to this lesson yet.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {quizzes.map(q => (
                          <Link key={q.id} href={`/quizzes/${q.id}`} className="surface" style={{ padding: 18, display: "block", color: "inherit", textDecoration: "none" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 className="serif" style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 500 }}>{q.title}</h4>
                                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)" }}>{q.description}</p>
                              </div>
                              <span className="chip chip-brand">Take quiz →</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="surface" style={{ padding: 22 }}>
                <h3 className="serif" style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 500 }}>Lesson info</h3>
                <div style={{ display: "grid", gap: 8, fontSize: 13, color: "var(--ink-2)" }}>
                  <InfoRow label="Added" value={new Date(lesson.createdAt).toLocaleDateString()} />
                  {tags.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Tags</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {tags.map(t => <span key={t} className="chip">{t}</span>)}
                      </div>
                    </div>
                  )}
                  <InfoRow label="Offline" value={offlineSaved ? "Saved on this device" : "Not saved"} />
                  <InfoRow label="Completed" value={completed === null ? "—" : completed ? "Yes" : "No"} />
                </div>
              </div>

              {quizzes.length > 0 && (
                <div className="surface" style={{ padding: 22, marginTop: 14 }}>
                  <h3 className="serif" style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 500 }}>Test yourself</h3>
                  {quizzes.slice(0, 3).map((q, i) => (
                    <Link key={q.id} href={`/quizzes/${q.id}`} style={{ display: "block", padding: "10px 0", borderTop: i ? "1px solid var(--hairline)" : "none", color: "inherit", textDecoration: "none" }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{q.title}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Take quiz →</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
    <span style={{ color: "var(--ink-3)" }}>{label}</span>
    <span style={{ fontWeight: 600 }}>{value}</span>
  </div>
);
