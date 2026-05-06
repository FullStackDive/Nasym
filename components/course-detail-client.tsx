"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Icon, Avatar, AppBar } from "./ui";
import { KhatamPattern } from "./motifs";

type CourseModule = {
  id: string;
  title: string;
  summary: string | null;
  position: number;
  _count: { materials: number; assignments: number; quizzes: number };
};

type Material = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: string | null;
  moduleId: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string };
};

type Announcement = {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  author: { id: string; name: string };
};

type Member = {
  id: string;
  user: { id: string; name: string; email: string; status: string };
  enrolledAt?: string;
  createdAt?: string;
};

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  isPublished: boolean;
  owner: { id: string; name: string; email: string };
  teachers: { id: string; isLead: boolean; user: { id: string; name: string; email: string } }[];
  modules: CourseModule[];
  _count: { enrolments: number; materials: number; announcements: number };
};

type AssignmentSummary = {
  id: string;
  title: string;
  instructions: string;
  dueAt: string | null;
  maxPoints: number;
  isPublished: boolean;
  moduleId: string | null;
  module: { id: string; title: string } | null;
  createdBy: { id: string; name: string };
  _count: { submissions: number };
};

type MySubmission = { status: string; score: number | null } | null;

type QuizSummary = {
  id: string;
  title: string;
  description: string;
  module: { id: string; title: string } | null;
  _count: { questions: number; attempts: number };
};

type RecordingSummary = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  durationSec: number | null;
  createdAt: string;
  uploadedBy: { id: string; name: string };
};

type Tab = "overview" | "modules" | "announcements" | "members" | "assignments" | "quizzes" | "recordings";

const fileIcon = (type: string | null) => {
  if (!type) return "download";
  if (type.startsWith("video")) return "play";
  if (type.startsWith("image")) return "eye";
  if (type.includes("pdf")) return "book";
  return "download";
};

const timeAgo = (iso: string) => {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

const CourseDetailClient = ({ courseId }: { courseId: string }) => {
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("overview");
  const [navTab, setNavTab] = useState("lessons");
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<{ enrolments: Member[]; teachers: Member[] }>({ enrolments: [], teachers: [] });
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Record<string, MySubmission>>({});
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [myBest, setMyBest] = useState<Record<string, number>>({});
  const [recordings, setRecordings] = useState<RecordingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Announcement compose
  const [annBody, setAnnBody] = useState("");
  const [annPinned, setAnnPinned] = useState(false);
  const [posting, setPosting] = useState(false);

  // Module compose
  const [newModTitle, setNewModTitle] = useState("");
  const [addingMod, setAddingMod] = useState(false);
  const [showModForm, setShowModForm] = useState(false);

  // Material upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadModuleId, setUploadModuleId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  // Recording upload form
  const [showRecordingForm, setShowRecordingForm] = useState(false);
  const [recForm, setRecForm] = useState({ title: "", description: "", videoUrl: "" });
  const [recFile, setRecFile] = useState<File | null>(null);
  const [uploadingRec, setUploadingRec] = useState(false);

  // Quiz create form
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizForm, setQuizForm] = useState({ title: "", description: "", moduleId: "" });
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  // Assignment create form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({ title: "", instructions: "", moduleId: "", dueAt: "", maxPoints: "100", isPublished: true });
  const [creatingAssign, setCreatingAssign] = useState(false);

  const role = session?.user?.role;
  const canEdit = role === "ADMIN" || role === "TEACHER";

  const loadCourse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) { setError("Course not found"); return; }
      const data = await res.json();
      setCourse(data.course);
      setModules(data.course.modules);
    } catch { setError("Failed to load course"); }
    finally { setLoading(false); }
  }, [courseId]);

  const loadMaterials = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/materials`);
    if (res.ok) setMaterials((await res.json()).materials);
  }, [courseId]);

  const loadAnnouncements = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/announcements`);
    if (res.ok) setAnnouncements((await res.json()).announcements);
  }, [courseId]);

  const loadMembers = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/members`);
    if (res.ok) setMembers(await res.json());
  }, [courseId]);

  const loadAssignments = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/assignments`);
    if (res.ok) {
      const data = await res.json();
      setAssignments(data.assignments);
      setMySubmissions(data.mySubmissions ?? {});
    }
  }, [courseId]);

  const loadQuizzes = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/quizzes`);
    if (res.ok) {
      const data = await res.json();
      setQuizzes(data.quizzes);
      setMyBest(data.myBest ?? {});
    }
  }, [courseId]);

  const loadRecordings = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}/recordings`);
    if (res.ok) setRecordings((await res.json()).recordings);
  }, [courseId]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

  useEffect(() => {
    if (tab === "modules") loadMaterials();
    if (tab === "announcements") loadAnnouncements();
    if (tab === "members") loadMembers();
    if (tab === "assignments") loadAssignments();
    if (tab === "quizzes") loadQuizzes();
    if (tab === "recordings") loadRecordings();
  }, [tab, loadMaterials, loadAnnouncements, loadMembers, loadAssignments, loadQuizzes, loadRecordings]);

  const postAnnouncement = async () => {
    if (!annBody.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: annBody, pinned: annPinned }),
      });
      if (res.ok) {
        const { announcement } = await res.json();
        setAnnouncements(a => [announcement, ...a]);
        setAnnBody(""); setAnnPinned(false);
      }
    } finally { setPosting(false); }
  };

  const deleteAnnouncement = async (id: string) => {
    const res = await fetch(`/api/courses/${courseId}/announcements/${id}`, { method: "DELETE" });
    if (res.ok) setAnnouncements(a => a.filter(x => x.id !== id));
  };

  const addModule = async () => {
    if (!newModTitle.trim()) return;
    setAddingMod(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newModTitle }),
      });
      if (res.ok) {
        const { module } = await res.json();
        setModules(m => [...m, module]);
        setNewModTitle(""); setShowModForm(false);
      }
    } finally { setAddingMod(false); }
  };

  const deleteModule = async (id: string) => {
    const res = await fetch(`/api/courses/${courseId}/modules/${id}`, { method: "DELETE" });
    if (res.ok) setModules(m => m.filter(x => x.id !== id));
  };

  const uploadMaterial = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !uploadTitle.trim()) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("title", uploadTitle);
      if (uploadModuleId) form.append("moduleId", uploadModuleId);
      const res = await fetch(`/api/courses/${courseId}/materials`, { method: "POST", body: form });
      if (res.ok) {
        const { material } = await res.json();
        setMaterials(m => [material, ...m]);
        setUploadTitle(""); setUploadModuleId(""); setShowUploadForm(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    } finally { setUploading(false); }
  };

  const deleteMaterial = async (id: string) => {
    const res = await fetch(`/api/courses/${courseId}/materials/${id}`, { method: "DELETE" });
    if (res.ok) setMaterials(m => m.filter(x => x.id !== id));
  };

  const createAssignment = async () => {
    if (!assignForm.title.trim() || !assignForm.instructions.trim()) return;
    setCreatingAssign(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: assignForm.title,
          instructions: assignForm.instructions,
          moduleId: assignForm.moduleId || undefined,
          dueAt: assignForm.dueAt ? new Date(assignForm.dueAt).toISOString() : null,
          maxPoints: parseInt(assignForm.maxPoints) || 100,
          isPublished: assignForm.isPublished,
        }),
      });
      if (res.ok) {
        const { assignment } = await res.json();
        setAssignments(a => [assignment, ...a]);
        setAssignForm({ title: "", instructions: "", moduleId: "", dueAt: "", maxPoints: "100", isPublished: true });
        setShowAssignForm(false);
      }
    } finally { setCreatingAssign(false); }
  };

  const deleteAssignment = async (id: string) => {
    const res = await fetch(`/api/courses/${courseId}/assignments/${id}`, { method: "DELETE" });
    if (res.ok) setAssignments(a => a.filter(x => x.id !== id));
  };

  const createQuiz = async () => {
    if (!quizForm.title.trim() || !quizForm.description.trim()) return;
    setCreatingQuiz(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: quizForm.title, description: quizForm.description, moduleId: quizForm.moduleId || undefined }),
      });
      if (res.ok) {
        const { quiz } = await res.json();
        setQuizzes(q => [quiz, ...q]);
        setQuizForm({ title: "", description: "", moduleId: "" });
        setShowQuizForm(false);
      }
    } finally { setCreatingQuiz(false); }
  };

  const deleteQuiz = async (id: string) => {
    const res = await fetch(`/api/courses/${courseId}/quizzes/${id}`, { method: "DELETE" });
    if (res.ok) setQuizzes(q => q.filter(x => x.id !== id));
  };

  const uploadRecording = async () => {
    if (!recForm.title.trim()) return;
    setUploadingRec(true);
    try {
      let res;
      if (recFile) {
        const form = new FormData();
        form.append("file", recFile);
        form.append("title", recForm.title);
        if (recForm.description) form.append("description", recForm.description);
        res = await fetch(`/api/courses/${courseId}/recordings`, { method: "POST", body: form });
      } else if (recForm.videoUrl.trim()) {
        res = await fetch(`/api/courses/${courseId}/recordings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: recForm.title, description: recForm.description, videoUrl: recForm.videoUrl }),
        });
      } else return;
      if (res.ok) {
        const { recording } = await res.json();
        setRecordings(r => [recording, ...r]);
        setRecForm({ title: "", description: "", videoUrl: "" }); setRecFile(null); setShowRecordingForm(false);
      }
    } finally { setUploadingRec(false); }
  };

  const deleteRecording = async (id: string) => {
    const res = await fetch(`/api/courses/${courseId}/recordings/${id}`, { method: "DELETE" });
    if (res.ok) setRecordings(r => r.filter(x => x.id !== id));
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

  if (error || !course) {
    return (
      <div className="app">
        <AppBar active={navTab} onNav={setNavTab} />
        <div className="app-scroll" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight: "60vh" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontWeight: 600 }}>{error || "Course not found"}</div>
          </div>
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: "home" | "book" | "newspaper" | "users" | "check" | "star" | "play" }[] = [
    { key: "overview", label: "Overview", icon: "home" },
    { key: "modules", label: "Modules & Materials", icon: "book" },
    { key: "recordings", label: "Recordings", icon: "play" },
    { key: "assignments", label: "Assignments", icon: "check" },
    { key: "quizzes", label: "Quizzes", icon: "star" },
    { key: "announcements", label: "Announcements", icon: "newspaper" },
    { key: "members", label: "Members", icon: "users" },
  ];

  return (
    <div className="app">
      <AppBar active={navTab} onNav={setNavTab} />
      <div className="app-scroll">
        {/* Hero */}
        <div style={{ position:"relative", height: 220, background: course.coverUrl ? undefined : "linear-gradient(135deg, var(--brand-700), var(--brand-900))", overflow:"hidden" }}>
          {course.coverUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={course.coverUrl} alt={course.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <KhatamPattern opacity={0.14} color="white" style={{ position:"absolute", inset:0 }} />
          }
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55))" }} />
          <div style={{ position:"absolute", bottom: 24, left: 36, right: 36, color:"white" }}>
            {!course.isPublished && (
              <span className="chip" style={{ background:"rgba(255,255,255,0.15)", color:"white", borderColor:"transparent", marginBottom: 8, display:"inline-block" }}>Draft</span>
            )}
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, textShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>{course.title}</h1>
            <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>by {course.owner.name}</div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 64px" }}>
          {/* Tab nav */}
          <div style={{ display:"flex", gap: 4, borderBottom:"1px solid var(--hairline)", marginBottom: 28, marginTop: 12 }}>
            {tabs.map(t => (
              <button
                key={t.key}
                className="btn btn-ghost"
                style={{
                  borderRadius: "8px 8px 0 0",
                  borderBottom: tab === t.key ? "2px solid var(--brand-700)" : "2px solid transparent",
                  color: tab === t.key ? "var(--brand-700)" : "var(--ink-2)",
                  fontWeight: tab === t.key ? 700 : 500,
                  paddingBottom: 10,
                }}
                onClick={() => setTab(t.key)}
              >
                <Icon name={t.icon} size={14} /> {t.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === "overview" && (
            <div style={{ display:"grid", gridTemplateColumns:"1.5fr .8fr", gap: 28 }}>
              <div>
                <div className="surface" style={{ padding: 26 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin:"0 0 12px" }}>About this course</h2>
                  <p style={{ color:"var(--ink-2)", lineHeight: 1.7, whiteSpace:"pre-wrap" }}>{course.description}</p>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap: 14 }}>
                <div className="surface" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-3)", marginBottom: 14 }}>Course info</div>
                  {[
                    ["Modules", course.modules.length],
                    ["Students", course._count.enrolments],
                    ["Materials", course._count.materials],
                    ["Announcements", course._count.announcements],
                  ].map(([label, val]) => (
                    <div key={label as string} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid var(--hairline)", fontSize: 14 }}>
                      <span style={{ color:"var(--ink-3)" }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
                <div className="surface" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-3)", marginBottom: 12 }}>Teachers</div>
                  {[{ user: course.owner, isLead: true }, ...course.teachers].map(t => (
                    <div key={t.user.id} style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 10 }}>
                      <Avatar name={t.user.name} size={32} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{t.user.name}</div>
                        {t.isLead && <div style={{ fontSize: 11, color:"var(--ink-3)" }}>Lead instructor</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modules & Materials */}
          {tab === "modules" && (
            <div>
              {canEdit && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Modules</h2>
                  <div style={{ display:"flex", gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowUploadForm(v => !v)}>
                      <Icon name="upload" size={13}/> Upload material
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModForm(v => !v)}>
                      <Icon name="plus" size={13}/> Add module
                    </button>
                  </div>
                </div>
              )}

              {/* Add module form */}
              {showModForm && canEdit && (
                <div className="surface" style={{ padding: 20, marginBottom: 16, display:"flex", gap: 10, alignItems:"flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label className="label">Module title</label>
                    <input className="input" value={newModTitle} onChange={e => setNewModTitle(e.target.value)} placeholder="e.g. Introduction to Tafsīr" onKeyDown={e => e.key === "Enter" && addModule()} />
                  </div>
                  <button className="btn btn-primary" onClick={addModule} disabled={addingMod || !newModTitle.trim()}>
                    {addingMod ? "Adding…" : "Add"}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setShowModForm(false); setNewModTitle(""); }}>Cancel</button>
                </div>
              )}

              {/* Upload material form */}
              {showUploadForm && canEdit && (
                <div className="surface" style={{ padding: 20, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, marginBottom: 14 }}>Upload material</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label className="label">Title *</label>
                      <input className="input" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} placeholder="Lecture notes, handout…" />
                    </div>
                    <div>
                      <label className="label">Module (optional)</label>
                      <select className="input" value={uploadModuleId} onChange={e => setUploadModuleId(e.target.value)}>
                        <option value="">No module</option>
                        {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="label">File *</label>
                    <input type="file" ref={fileRef} className="input" style={{ padding: "8px 12px" }} />
                  </div>
                  <div style={{ display:"flex", gap: 8 }}>
                    <button className="btn btn-primary" onClick={uploadMaterial} disabled={uploading || !uploadTitle.trim()}>
                      {uploading ? "Uploading…" : "Upload"}
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setShowUploadForm(false); setUploadTitle(""); }}>Cancel</button>
                  </div>
                </div>
              )}

              {modules.length === 0 ? (
                <div className="surface" style={{ padding: 40, textAlign:"center", color:"var(--ink-3)" }}>
                  No modules yet.{canEdit ? " Add one above." : ""}
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap: 12 }}>
                  {modules.map((mod, idx) => {
                    const modMaterials = materials.filter(m => m.moduleId === mod.id);
                    return (
                      <div key={mod.id} className="surface" style={{ overflow:"hidden" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom: modMaterials.length > 0 ? "1px solid var(--hairline)" : undefined }}>
                          <div style={{ display:"flex", alignItems:"center", gap: 12 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background:"var(--brand-700)", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                              {idx + 1}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>{mod.title}</div>
                              {mod.summary && <div style={{ fontSize: 13, color:"var(--ink-3)", marginTop: 2 }}>{mod.summary}</div>}
                            </div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap: 12 }}>
                            <div style={{ fontSize: 12, color:"var(--ink-3)" }}>
                              {mod._count.materials} file{mod._count.materials !== 1 ? "s" : ""}
                            </div>
                            {canEdit && (
                              <button className="btn btn-ghost btn-sm" style={{ color:"var(--error, #e53e3e)", padding:"4px 8px" }} onClick={() => deleteModule(mod.id)}>
                                <Icon name="trash" size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                        {modMaterials.length > 0 && (
                          <div style={{ padding:"8px 0" }}>
                            {modMaterials.map(mat => (
                              <MaterialRow key={mat.id} material={mat} canEdit={canEdit} onDelete={deleteMaterial} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Unattached materials */}
              {materials.filter(m => !m.moduleId).length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-3)", marginBottom: 10 }}>Other materials</div>
                  <div className="surface" style={{ overflow:"hidden" }}>
                    {materials.filter(m => !m.moduleId).map(mat => (
                      <MaterialRow key={mat.id} material={mat} canEdit={canEdit} onDelete={deleteMaterial} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assignments */}
          {tab === "assignments" && (
            <div>
              {canEdit && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Assignments</h2>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAssignForm(v => !v)}>
                    <Icon name="plus" size={13}/> New assignment
                  </button>
                </div>
              )}

              {/* Create form */}
              {showAssignForm && canEdit && (
                <div className="surface" style={{ padding: 24, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>New assignment</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div style={{ gridColumn:"1 / -1" }}>
                      <label className="label">Title *</label>
                      <input className="input" value={assignForm.title} onChange={e => setAssignForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Reflection on Sūrah al-Fātiḥah" />
                    </div>
                    <div style={{ gridColumn:"1 / -1" }}>
                      <label className="label">Instructions *</label>
                      <textarea className="input" rows={4} value={assignForm.instructions} onChange={e => setAssignForm(f => ({ ...f, instructions: e.target.value }))} placeholder="What should students do?" style={{ resize:"vertical" }} />
                    </div>
                    <div>
                      <label className="label">Due date (optional)</label>
                      <input className="input" type="datetime-local" value={assignForm.dueAt} onChange={e => setAssignForm(f => ({ ...f, dueAt: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Max points</label>
                      <input className="input" type="number" min="1" max="1000" value={assignForm.maxPoints} onChange={e => setAssignForm(f => ({ ...f, maxPoints: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">Module (optional)</label>
                      <select className="input" value={assignForm.moduleId} onChange={e => setAssignForm(f => ({ ...f, moduleId: e.target.value }))}>
                        <option value="">No module</option>
                        {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                    </div>
                    <div style={{ display:"flex", alignItems:"flex-end", paddingBottom: 4 }}>
                      <label style={{ display:"flex", alignItems:"center", gap: 8, cursor:"pointer", fontSize: 14, fontWeight: 600 }}>
                        <input type="checkbox" checked={assignForm.isPublished} onChange={e => setAssignForm(f => ({ ...f, isPublished: e.target.checked }))} />
                        Publish immediately
                      </label>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap: 8 }}>
                    <button className="btn btn-primary" onClick={createAssignment} disabled={creatingAssign || !assignForm.title.trim()}>
                      {creatingAssign ? "Creating…" : "Create assignment"}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setShowAssignForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {assignments.length === 0 ? (
                <div className="surface" style={{ padding: 48, textAlign:"center", color:"var(--ink-3)" }}>
                  No assignments yet.{canEdit ? " Create one above." : ""}
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
                  {assignments.map(a => {
                    const sub = mySubmissions[a.id];
                    const isOverdue = a.dueAt && new Date(a.dueAt).getTime() < Date.now() && !sub;
                    return (
                      <div key={a.id} className="surface" style={{ padding: 20, borderLeft: isOverdue ? "3px solid var(--danger, #e53e3e)" : undefined }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 4 }}>
                              <a href={`/courses/${courseId}/assignments/${a.id}`} style={{ fontWeight: 700, fontSize: 15, color:"var(--brand-700)", textDecoration:"none" }}>
                                {a.title}
                              </a>
                              {!a.isPublished && <span className="chip" style={{ fontSize: 10 }}>Draft</span>}
                              {sub && (
                                <span className="chip" style={{
                                  fontSize: 10,
                                  background: sub.status === "GRADED" ? "color-mix(in oklch, var(--brand-500) 14%, transparent)" : "color-mix(in oklch, var(--ink-3) 14%, transparent)",
                                  color: sub.status === "GRADED" ? "var(--brand-800)" : "var(--ink-3)",
                                  borderColor:"transparent",
                                }}>
                                  {sub.status === "GRADED" ? `Graded ${sub.score !== null ? `· ${sub.score}/${a.maxPoints}` : ""}` : sub.status}
                                </span>
                              )}
                            </div>
                            {a.module && <div style={{ fontSize: 12, color:"var(--ink-3)", marginBottom: 6 }}>Module: {a.module.title}</div>}
                            <div style={{ fontSize: 13, color:"var(--ink-2)", lineHeight: 1.5, display:"-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                              {a.instructions}
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, textAlign:"right", marginLeft: 16 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color:"var(--brand-700)" }}>{a.maxPoints} pts</div>
                            {a.dueAt && (
                              <div style={{ fontSize: 11, color: isOverdue ? "var(--danger, #e53e3e)" : "var(--ink-3)", marginTop: 2 }}>
                                Due {new Date(a.dueAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                              </div>
                            )}
                            {canEdit && (
                              <div style={{ display:"flex", gap: 4, justifyContent:"flex-end", marginTop: 8 }}>
                                <span style={{ fontSize: 11, color:"var(--ink-3)" }}>{a._count.submissions} submitted</span>
                                <button className="btn btn-ghost btn-sm" style={{ color:"var(--danger, #e53e3e)", padding:"2px 6px" }} onClick={() => deleteAssignment(a.id)}>
                                  <Icon name="trash" size={12}/>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Recordings */}
          {tab === "recordings" && (
            <div>
              {canEdit && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Recordings</h2>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowRecordingForm(v => !v)}>
                    <Icon name="upload" size={13}/> Add recording
                  </button>
                </div>
              )}

              {showRecordingForm && canEdit && (
                <div className="surface" style={{ padding: 24, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Add recording</div>
                  <div style={{ display:"flex", flexDirection:"column", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label className="label">Title *</label>
                      <input className="input" value={recForm.title} onChange={e => setRecForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Week 3 — Lesson recording" />
                    </div>
                    <div>
                      <label className="label">Description (optional)</label>
                      <textarea className="input" rows={2} value={recForm.description} onChange={e => setRecForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief summary…" style={{ resize:"vertical" }} />
                    </div>
                    <div>
                      <label className="label">Upload video file</label>
                      <input type="file" accept="video/*" className="input" style={{ padding:"8px 12px" }} onChange={e => setRecFile(e.target.files?.[0] ?? null)} />
                    </div>
                    <div style={{ textAlign:"center", color:"var(--ink-3)", fontSize:13 }}>— or —</div>
                    <div>
                      <label className="label">External URL (YouTube embed, Vimeo, etc.)</label>
                      <input className="input" value={recForm.videoUrl} onChange={e => setRecForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://…" disabled={!!recFile} />
                    </div>
                  </div>
                  <div style={{ display:"flex", gap: 8 }}>
                    <button className="btn btn-primary" onClick={uploadRecording} disabled={uploadingRec || !recForm.title.trim() || (!recFile && !recForm.videoUrl.trim())}>
                      {uploadingRec ? "Uploading…" : "Add recording"}
                    </button>
                    <button className="btn btn-ghost" onClick={() => { setShowRecordingForm(false); setRecFile(null); }}>Cancel</button>
                  </div>
                </div>
              )}

              {recordings.length === 0 ? (
                <div className="surface" style={{ padding: 48, textAlign:"center", color:"var(--ink-3)" }}>
                  No recordings yet.{canEdit ? " Add one above." : ""}
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {recordings.map(rec => (
                    <RecordingCard key={rec.id} recording={rec} courseId={courseId} canEdit={canEdit} onDelete={deleteRecording} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quizzes */}
          {tab === "quizzes" && (
            <div>
              {canEdit && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 20 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Quizzes</h2>
                  <button className="btn btn-primary btn-sm" onClick={() => setShowQuizForm(v => !v)}>
                    <Icon name="plus" size={13}/> New quiz
                  </button>
                </div>
              )}

              {showQuizForm && canEdit && (
                <div className="surface" style={{ padding: 24, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>New quiz</div>
                  <div style={{ display:"flex", flexDirection:"column", gap: 12, marginBottom: 14 }}>
                    <div>
                      <label className="label">Title *</label>
                      <input className="input" value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Week 3 Comprehension Quiz" />
                    </div>
                    <div>
                      <label className="label">Description *</label>
                      <textarea className="input" rows={2} value={quizForm.description} onChange={e => setQuizForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of what this quiz covers…" style={{ resize:"vertical" }} />
                    </div>
                    <div>
                      <label className="label">Module (optional)</label>
                      <select className="input" value={quizForm.moduleId} onChange={e => setQuizForm(f => ({ ...f, moduleId: e.target.value }))}>
                        <option value="">No module</option>
                        {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap: 8 }}>
                    <button className="btn btn-primary" onClick={createQuiz} disabled={creatingQuiz || !quizForm.title.trim()}>
                      {creatingQuiz ? "Creating…" : "Create quiz"}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setShowQuizForm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {quizzes.length === 0 ? (
                <div className="surface" style={{ padding: 48, textAlign:"center", color:"var(--ink-3)" }}>
                  No quizzes yet.{canEdit ? " Create one above." : ""}
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
                  {quizzes.map(q => {
                    const best = myBest[q.id];
                    return (
                      <div key={q.id} className="surface" style={{ padding: 20 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 4 }}>
                              <a href={`/courses/${courseId}/quizzes/${q.id}`} style={{ fontWeight: 700, fontSize: 15, color:"var(--brand-700)", textDecoration:"none" }}>
                                {q.title}
                              </a>
                              {best !== undefined && (
                                <span className="chip" style={{ fontSize: 10, background:"color-mix(in oklch, var(--brand-500) 14%, transparent)", color:"var(--brand-800)", borderColor:"transparent" }}>
                                  Best: {best}%
                                </span>
                              )}
                            </div>
                            {q.module && <div style={{ fontSize: 12, color:"var(--ink-3)", marginBottom: 4 }}>Module: {q.module.title}</div>}
                            <p style={{ fontSize: 13, color:"var(--ink-2)", margin: 0 }}>{q.description}</p>
                          </div>
                          <div style={{ flexShrink: 0, textAlign:"right", marginLeft: 16 }}>
                            <div style={{ fontSize: 13, color:"var(--ink-3)" }}>{q._count.questions} question{q._count.questions !== 1 ? "s" : ""}</div>
                            {canEdit && (
                              <div style={{ display:"flex", gap: 4, justifyContent:"flex-end", marginTop: 6 }}>
                                <span style={{ fontSize: 11, color:"var(--ink-3)" }}>{q._count.attempts} attempt{q._count.attempts !== 1 ? "s" : ""}</span>
                                <button className="btn btn-ghost btn-sm" style={{ color:"var(--danger, #e53e3e)", padding:"2px 6px" }} onClick={() => deleteQuiz(q.id)}>
                                  <Icon name="trash" size={12}/>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Announcements */}
          {tab === "announcements" && (
            <div>
              {canEdit && (
                <div className="surface" style={{ padding: 20, marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>Post announcement</div>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Share an update with the class…"
                    value={annBody}
                    onChange={e => setAnnBody(e.target.value)}
                    style={{ resize:"vertical", marginBottom: 10 }}
                  />
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <label style={{ display:"flex", alignItems:"center", gap: 6, fontSize: 13, cursor:"pointer" }}>
                      <input type="checkbox" checked={annPinned} onChange={e => setAnnPinned(e.target.checked)} />
                      Pin to top
                    </label>
                    <button className="btn btn-primary btn-sm" onClick={postAnnouncement} disabled={posting || !annBody.trim()}>
                      {posting ? "Posting…" : <><Icon name="send" size={13}/> Post</>}
                    </button>
                  </div>
                </div>
              )}

              {announcements.length === 0 ? (
                <div className="surface" style={{ padding: 40, textAlign:"center", color:"var(--ink-3)" }}>
                  No announcements yet.
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap: 12 }}>
                  {announcements.map(ann => (
                    <div key={ann.id} className="surface" style={{ padding: 20, borderLeft: ann.pinned ? "3px solid var(--brand-700)" : undefined }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 12 }}>
                          <Avatar name={ann.author.name} size={34} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{ann.author.name}</div>
                            <div style={{ fontSize: 12, color:"var(--ink-3)" }}>
                              {ann.pinned && <><Icon name="star" size={11} /> Pinned · </>}
                              {timeAgo(ann.createdAt)}
                            </div>
                          </div>
                        </div>
                        {canEdit && (
                          <button className="btn btn-ghost btn-sm" style={{ color:"var(--error, #e53e3e)" }} onClick={() => deleteAnnouncement(ann.id)}>
                            <Icon name="trash" size={13} />
                          </button>
                        )}
                      </div>
                      <p style={{ margin: 0, lineHeight: 1.7, whiteSpace:"pre-wrap", color:"var(--ink-2)" }}>{ann.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Members */}
          {tab === "members" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 24 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Teachers ({members.teachers.length})</h2>
                <div className="surface" style={{ overflow:"hidden" }}>
                  {members.teachers.length === 0 ? (
                    <div style={{ padding: 24, textAlign:"center", color:"var(--ink-3)", fontSize: 14 }}>None assigned</div>
                  ) : members.teachers.map((t, i) => (
                    <MemberRow key={t.id} member={t} i={i} total={members.teachers.length} />
                  ))}
                </div>
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Students ({members.enrolments.length})</h2>
                <div className="surface" style={{ overflow:"hidden" }}>
                  {members.enrolments.length === 0 ? (
                    <div style={{ padding: 24, textAlign:"center", color:"var(--ink-3)", fontSize: 14 }}>No students enrolled</div>
                  ) : members.enrolments.map((e, i) => (
                    <MemberRow key={e.id} member={e} i={i} total={members.enrolments.length} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MaterialRow = ({
  material,
  canEdit,
  onDelete,
}: {
  material: Material;
  canEdit: boolean;
  onDelete: (id: string) => void;
}) => (
  <div style={{ display:"flex", alignItems:"center", gap: 12, padding:"10px 20px", borderBottom:"1px solid var(--hairline)" }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background:"var(--bg-soft)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink: 0 }}>
      <Icon name={fileIcon(material.fileType)} size={14} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 14, color:"var(--brand-700)", textDecoration:"none" }}>
        {material.title}
      </a>
      {material.description && <div style={{ fontSize: 12, color:"var(--ink-3)" }}>{material.description}</div>}
    </div>
    <div style={{ fontSize: 11, color:"var(--ink-3)", flexShrink: 0 }}>{material.uploadedBy.name}</div>
    {canEdit && (
      <button className="btn btn-ghost btn-sm" style={{ color:"var(--error, #e53e3e)", padding:"4px 8px", flexShrink: 0 }} onClick={() => onDelete(material.id)}>
        <Icon name="trash" size={13} />
      </button>
    )}
  </div>
);

const MemberRow = ({ member, i, total }: { member: Member; i: number; total: number }) => (
  <div style={{ display:"flex", alignItems:"center", gap: 12, padding:"12px 20px", borderBottom: i < total - 1 ? "1px solid var(--hairline)" : undefined }}>
    <Avatar name={member.user.name} size={34} />
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{member.user.name}</div>
      <div style={{ fontSize: 12, color:"var(--ink-3)" }}>{member.user.email}</div>
    </div>
  </div>
);

const RecordingCard = ({
  recording,
  courseId,
  canEdit,
  onDelete,
}: {
  recording: RecordingSummary;
  courseId: string;
  canEdit: boolean;
  onDelete: (id: string) => void;
}) => {
  const isPrivate = recording.videoUrl.startsWith("private:");
  const streamUrl = isPrivate ? `/api/recordings/${recording.id}/stream` : null;
  const externalUrl = !isPrivate ? recording.videoUrl : null;
  const duration = recording.durationSec
    ? `${Math.floor(recording.durationSec / 60)}:${String(recording.durationSec % 60).padStart(2, "0")}`
    : null;

  return (
    <div className="surface" style={{ overflow:"hidden" }}>
      {/* Thumbnail / player preview */}
      <a href={`/courses/${courseId}/recordings/${recording.id}`} style={{ display:"block", position:"relative", aspectRatio:"16/9", background:"linear-gradient(135deg, var(--brand-700), var(--brand-900))", textDecoration:"none" }}>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,0.18)", display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
            <Icon name="play" size={22} />
          </div>
        </div>
        {duration && (
          <span style={{ position:"absolute", bottom:8, right:10, fontSize:11, fontWeight:700, color:"white", background:"rgba(0,0,0,0.55)", padding:"2px 6px", borderRadius:4 }}>{duration}</span>
        )}
        {externalUrl && (
          <span style={{ position:"absolute", top:8, left:10, fontSize:10, fontWeight:700, color:"white", background:"rgba(0,0,0,0.45)", padding:"2px 6px", borderRadius:4 }}>External</span>
        )}
        {streamUrl && (
          <span style={{ position:"absolute", top:8, left:10, fontSize:10, fontWeight:700, color:"white", background:"color-mix(in oklch, var(--brand-700) 80%, black)", padding:"2px 6px", borderRadius:4 }}><Icon name="lock" size={9}/> Private</span>
        )}
      </a>
      <div style={{ padding:"14px 16px 16px" }}>
        <a href={`/courses/${courseId}/recordings/${recording.id}`} style={{ fontWeight:700, fontSize:14, color:"inherit", textDecoration:"none", display:"block", marginBottom:4 }}>{recording.title}</a>
        {recording.description && <p style={{ fontSize:12, color:"var(--ink-3)", margin:"0 0 8px", lineHeight:1.5 }}>{recording.description}</p>}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:"var(--ink-3)" }}>
          <span>{recording.uploadedBy.name}</span>
          {canEdit && (
            <button className="btn btn-ghost btn-sm" style={{ color:"var(--danger,#e53e3e)", padding:"2px 6px" }} onClick={() => onDelete(recording.id)}>
              <Icon name="trash" size={12}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailClient;
