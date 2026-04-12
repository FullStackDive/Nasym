"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";

type ClassSession = { id: string; title: string; description: string; scheduledAt: string; isLive: boolean; roomName: string };

function toLocalDatetimeValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminClassesClient() {
  const [items, setItems] = useState<ClassSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [roomName, setRoomName] = useState("");
  const [isLive, setIsLive] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/classes");
    const d = await res.json().catch(() => ({}));
    setItems(d.sessions ?? []);
  }

  useEffect(() => { refresh(); }, []);

  function resetForm() {
    setSelectedId(null);
    setTitle(""); setDescription(""); setScheduledAt(""); setRoomName(""); setIsLive(false);
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
      roomName, isLive
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
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Class sessions</h1>
          <p className="mt-2 text-slate-600">Create and manage live / scheduled classroom sessions (Jitsi rooms).</p>
        </div>
        <Link href="/admin"><Button variant="secondary">Back</Button></Link>
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/classes/${s.id}`} className="text-sm font-semibold">Open →</Link>
                  <button onClick={() => loadForEdit(s.id)} className="text-sm font-semibold text-brand-700">Edit</button>
                  <button onClick={() => remove(s.id)} className="text-sm font-semibold text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
