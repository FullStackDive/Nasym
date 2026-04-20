"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, Input, Textarea, Badge } from "@/components/ui";

type Lesson = { id: string; title: string; description: string; videoUrl: string; tags?: string | null; createdAt: string };

export default function AdminLessonsClient() {
  const [items, setItems] = useState<Lesson[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [tags, setTags] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/lessons");
    const d = await res.json().catch(() => ({}));
    setItems(d.lessons ?? []);
  }

  async function load(id: string) {
    setErr(null);
    const res = await fetch(`/api/admin/lessons/${id}`);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(d?.error ?? "Failed to load lesson");
      return;
    }
    const l = d.lesson as Lesson;
    setSelectedId(l.id);
    setTitle(l.title);
    setDescription(l.description);
    setVideoUrl(l.videoUrl);
    setTags(l.tags ?? "");
  }

  function resetForm() {
    setSelectedId(null);
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setTags("");
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const res = await fetch("/api/admin/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, videoUrl, tags: tags || undefined })
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
    const res = await fetch(`/api/admin/lessons/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, videoUrl, tags: tags || null })
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
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    setDeleting(true);
    setErr(null);
    const res = await fetch(`/api/admin/lessons/${selectedId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      setErr((await res.json().catch(() => ({})))?.error ?? "Delete failed");
      return;
    }
    resetForm();
    await refresh();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Lessons manager</h1>
          <p className="mt-2 text-slate-600">Create, edit, and delete recorded lessons.</p>
        </div>
        <Link href="/admin"><Button variant="secondary">Back</Button></Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-extrabold">{selectedId ? "Edit lesson" : "Create lesson"}</h2>
            {selectedId && <Badge>Editing</Badge>}
          </div>

          <form className="mt-4 space-y-3" onSubmit={selectedId ? update : create}>
            <div>
              <label className="text-sm font-semibold">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-semibold">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} required />
            </div>
            <div>
              <label className="text-sm font-semibold">Video URL (embed)</label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." required />
            </div>
            <div>
              <label className="text-sm font-semibold">Tags (comma-separated)</label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="salah,aqeedah,beginners" />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <div className="flex flex-wrap gap-2">
              <Button className="flex-1" disabled={saving}>{saving ? "Saving..." : (selectedId ? "Save changes" : "Create")}</Button>
              {selectedId ? (
                <>
                  <Button type="button" variant="secondary" onClick={resetForm}>New lesson</Button>
                  <Button type="button" variant="danger" onClick={remove} disabled={deleting}>
                    {deleting ? "Deleting..." : "Delete"}
                  </Button>
                </>
              ) : null}
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Existing lessons</h2>
          <p className="mt-2 text-sm text-slate-600">Click an item to edit.</p>
          <div className="mt-4 space-y-3">
            {items.map((l) => (
              <button
                key={l.id}
                onClick={() => load(l.id)}
                className={`w-full text-left rounded-2xl border p-4 transition ${
                  selectedId === l.id ? "border-brand-300 bg-brand-50" : "border-slate-100 hover:bg-slate-50"
                }`}
              >
                <p className="font-extrabold">{l.title}</p>
                <p className="mt-1 text-sm text-slate-700 line-clamp-2">{l.description}</p>
                <p className="mt-2 text-xs text-slate-500">{new Date(l.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
