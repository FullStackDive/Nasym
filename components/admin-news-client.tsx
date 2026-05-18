"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Input, Textarea } from "@/components/ui";
import { AdminShell } from "@/components/admin-client";

type News = { id: string; title: string; body: string; pinned: boolean; createdAt: string };

export default function AdminNewsClient() {
  const [posts, setPosts] = useState<News[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/news");
    const d = await res.json().catch(() => ({}));
    setPosts(d.posts ?? []);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, []);

  function resetForm() {
    setSelectedId(null);
    setTitle(""); setBody(""); setPinned(false);
    setErr(null);
  }

  async function loadForEdit(id: string) {
    const res = await fetch(`/api/admin/news/${id}`);
    if (!res.ok) return;
    const d = await res.json().catch(() => ({}));
    const n = d.post;
    setSelectedId(id);
    setTitle(n.title);
    setBody(n.body);
    setPinned(n.pinned);
    setErr(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const res = await fetch(
      selectedId ? `/api/admin/news/${selectedId}` : "/api/admin/news",
      { method: selectedId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body, pinned }) }
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
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
    if (selectedId === id) resetForm();
    await refresh();
  }

  return (
    <AdminShell active="news">
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">News manager</h1>
          <p className="mt-2 text-slate-600">Create and manage announcements for students.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">{selectedId ? "Edit post" : "Create post"}</h2>
            {selectedId && <Button variant="ghost" onClick={resetForm}>+ New post</Button>}
          </div>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <div>
              <label className="text-sm font-semibold">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-semibold">Body</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} required />
            </div>
            <label className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
              <span className="font-semibold">Pinned</span>
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-5 w-5 accent-green-600" />
            </label>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex gap-2">
              <Button className="flex-1" disabled={saving}>{saving ? "Saving…" : selectedId ? "Save changes" : "Create"}</Button>
              {selectedId && <Button variant="secondary" type="button" onClick={resetForm}>Cancel</Button>}
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Existing posts</h2>
          <div className="mt-4 space-y-3">
            {posts.length === 0 && <p className="text-sm text-slate-600">No posts yet.</p>}
            {posts.map((n) => (
              <div key={n.id} className={`rounded-2xl border p-4 ${selectedId === n.id ? "border-brand-400 bg-brand-50" : "border-slate-100"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {n.pinned && <Badge>Pinned</Badge>}
                  <p className="font-extrabold">{n.title}</p>
                </div>
                <p className="mt-2 text-sm text-slate-700 line-clamp-3">{n.body}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</p>
                <div className="mt-3 flex gap-3">
                  <button onClick={() => loadForEdit(n.id)} className="text-sm font-semibold text-brand-700">Edit</button>
                  <button onClick={() => remove(n.id)} className="text-sm font-semibold text-red-600">Delete</button>
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
