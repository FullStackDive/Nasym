"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";
import { AdminShell } from "@/components/admin-client";

type CourseOption = { id: string; title: string };
type ClassSession = {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  isLive: boolean;
  roomName: string;
  courseId: string | null;
  course: CourseOption | null;
};

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminClassesClient() {
  const [items, setItems] = useState<ClassSession[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [roomName, setRoomName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [recordingFor, setRecordingFor] = useState<ClassSession | null>(null);
  const [recordingCourseId, setRecordingCourseId] = useState("");
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingDescription, setRecordingDescription] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [recordingErr, setRecordingErr] = useState<string | null>(null);
  const [recordingSaving, setRecordingSaving] = useState(false);
  const [recordingSaved, setRecordingSaved] = useState<string | null>(null);

  async function refresh() {
    const [classesRes, coursesRes] = await Promise.all([
      fetch("/api/admin/classes"),
      fetch("/api/courses"),
    ]);
    const classesData = await classesRes.json().catch(() => ({}));
    const coursesData = await coursesRes.json().catch(() => ({}));
    setItems(classesData.sessions ?? []);
    setCourses((coursesData.courses ?? []).map((course: CourseOption) => ({ id: course.id, title: course.title })));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, []);

  function resetForm() {
    setSelectedId(null);
    setTitle(""); setDescription(""); setScheduledAt(""); setRoomName(""); setCourseId(""); setIsLive(false);
    setErr(null);
  }

  async function loadForEdit(id: string) {
    const res = await fetch(`/api/admin/classes/${id}`);
    if (!res.ok) return;
    const d = await res.json().catch(() => ({}));
    const s = d.session;
    setSelectedId(id);
    setTitle(s.title);
    setDescription(s.description);
    setScheduledAt(toLocalDatetimeValue(s.scheduledAt));
    setRoomName(s.roomName);
    setCourseId(s.courseId ?? "");
    setIsLive(s.isLive);
    setErr(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const payload = {
      title, description,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : "",
      roomName,
      courseId: courseId || null,
      isLive
    };
    const res = await fetch(
      selectedId ? `/api/admin/classes/${selectedId}` : "/api/admin/classes",
      { method: selectedId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );
    setSaving(false);
    if (!res.ok) {
      setErr((await res.json().catch(() => ({})))?.error ?? "Save failed");
      return;
    }
    resetForm();
    await refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this session? This cannot be undone.")) return;
    await fetch(`/api/admin/classes/${id}`, { method: "DELETE" });
    if (selectedId === id) resetForm();
    if (recordingFor?.id === id) setRecordingFor(null);
    await refresh();
  }

  function startRecording(session: ClassSession) {
    setRecordingFor(session);
    setRecordingCourseId(session.courseId ?? "");
    setRecordingTitle(`${session.title} — Recording`);
    setRecordingDescription("");
    setRecordingUrl("");
    setRecordingErr(null);
    setRecordingSaved(null);
  }

  async function addRecording(e: React.FormEvent) {
    e.preventDefault();
    if (!recordingFor) return;
    if (!recordingCourseId) {
      setRecordingErr("Choose the course whose students should receive this recording.");
      return;
    }
    if (!recordingUrl.trim()) {
      setRecordingErr("Paste the Unlisted YouTube link.");
      return;
    }

    setRecordingSaving(true);
    setRecordingErr(null);
    setRecordingSaved(null);

    const res = await fetch(`/api/courses/${recordingCourseId}/recordings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: recordingTitle,
        description: recordingDescription,
        videoUrl: recordingUrl,
        classSessionId: recordingFor.id,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setRecordingSaving(false);

    if (!res.ok) {
      setRecordingErr(data.error ?? "Could not add recording.");
      return;
    }

    setRecordingSaved("Recording added successfully.");
    setRecordingUrl("");
    setTimeout(() => {
      setRecordingFor(null);
      setRecordingSaved(null);
    }, 1200);
  }

  return (
    <AdminShell active="classes">
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Class sessions</h1>
          <p className="mt-2 text-slate-600">Create and manage live / scheduled classroom sessions (Jitsi rooms).</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">{selectedId ? "Edit session" : "Create session"}</h2>
            {selectedId && <Button variant="ghost" onClick={resetForm}>+ New session</Button>}
          </div>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <div>
              <label className="text-sm font-semibold">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-semibold">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />
            </div>
            <div>
              <label className="text-sm font-semibold">Scheduled at</label>
              <Input value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} type="datetime-local" required />
              <p className="mt-1 text-xs text-slate-500">Your browser timezone will be used.</p>
            </div>
            <div>
              <label className="text-sm font-semibold">Course (optional)</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              >
                <option value="">Standalone class — all logged-in users</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Linking a class to a course restricts room access to that course&apos;s teachers and enrolled students.
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold">Room name</label>
              <Input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="noor-youth-class-01" required disabled={!!selectedId} />
              {selectedId && <p className="mt-1 text-xs text-slate-500">Room name cannot be changed after creation.</p>}
              {!selectedId && <p className="mt-1 text-xs text-slate-500">Allowed: letters, numbers, dash, underscore.</p>}
            </div>
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
              <span className="font-semibold">Mark as Live now</span>
              <input type="checkbox" checked={isLive} onChange={(e) => setIsLive(e.target.checked)} className="h-5 w-5 accent-green-600" />
            </label>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex gap-2">
              <Button className="flex-1" disabled={saving}>{saving ? "Saving…" : selectedId ? "Save changes" : "Create"}</Button>
              {selectedId && <Button variant="secondary" type="button" onClick={resetForm}>Cancel</Button>}
            </div>
          </form>
        </Card>

        <Card className="p-6">
          {recordingFor && (
            <div className="mb-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold">Add class recording</p>
                  <p className="mt-1 text-xs text-slate-600">{recordingFor.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRecordingFor(null)}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>

              <form className="mt-4 space-y-3" onSubmit={addRecording}>
                <div>
                  <label className="text-sm font-semibold">Course *</label>
                  <select
                    value={recordingCourseId}
                    onChange={(e) => setRecordingCourseId(e.target.value)}
                    disabled={!!recordingFor.courseId}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">Choose course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                  {!recordingFor.courseId && (
                    <p className="mt-1 text-xs text-slate-500">
                      This is a standalone class, so choose which course should receive the recording.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-semibold">Recording title *</label>
                  <Input value={recordingTitle} onChange={(e) => setRecordingTitle(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-semibold">Unlisted YouTube link *</label>
                  <Input
                    value={recordingUrl}
                    onChange={(e) => setRecordingUrl(e.target.value)}
                    placeholder="https://youtu.be/..."
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Upload the video to YouTube as Unlisted, then paste the share link here.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold">Description (optional)</label>
                  <Textarea value={recordingDescription} onChange={(e) => setRecordingDescription(e.target.value)} rows={3} />
                </div>
                {recordingErr && <p className="text-sm text-red-600">{recordingErr}</p>}
                {recordingSaved && <p className="text-sm font-semibold text-green-700">{recordingSaved}</p>}
                <Button className="w-full" disabled={recordingSaving || !recordingTitle.trim() || !recordingUrl.trim()}>
                  {recordingSaving ? "Adding…" : "Add recording"}
                </Button>
              </form>
            </div>
          )}

          <h2 className="font-extrabold">Existing sessions</h2>
          <div className="mt-4 space-y-3">
            {items.length === 0 && <p className="text-sm text-slate-600">No sessions yet.</p>}
            {items.map((s) => (
              <div key={s.id} className={`rounded-2xl border p-4 ${selectedId === s.id ? "border-brand-400 bg-brand-50" : "border-slate-100"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-extrabold">{s.title}</p>
                  {s.isLive ? <Badge className="bg-red-100 text-red-800">Live</Badge> : <Badge>Scheduled</Badge>}
                </div>
                <p className="mt-1 text-xs text-slate-500">{new Date(s.scheduledAt).toLocaleString()}</p>
                <p className="mt-2 text-sm text-slate-700 line-clamp-2">{s.description}</p>
                <p className="mt-2 text-xs text-slate-500">Room: {s.roomName}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Course: <span className="font-semibold text-slate-700">{s.course?.title ?? "Standalone class"}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/classes/${s.id}`} className="text-sm font-semibold">Open →</Link>
                  <button onClick={() => loadForEdit(s.id)} className="text-sm font-semibold text-brand-700">Edit</button>
                  {!s.isLive && (
                    <button onClick={() => startRecording(s)} className="text-sm font-semibold text-brand-700">Add recording</button>
                  )}
                  <button onClick={() => remove(s.id)} className="text-sm font-semibold text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
    </AdminShell>
  );
}
