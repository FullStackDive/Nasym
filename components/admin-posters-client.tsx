"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button, Card, Input } from "@/components/ui";
import { AdminShell } from "@/components/admin-client";

type Poster = { id: string; title: string; imageUrl: string; ctaText?: string | null; ctaHref?: string | null; createdAt: string };

export default function AdminPostersClient() {
  const [items, setItems] = useState<Poster[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // File upload state
  const [inputMode, setInputMode] = useState<"url" | "file">("url");
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const res = await fetch("/api/admin/posters");
    const d = await res.json().catch(() => ({}));
    setItems(d.posters ?? []);
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, []);

  function resetForm() {
    setSelectedId(null);
    setTitle(""); setImageUrl(""); setCtaText(""); setCtaHref("");
    setErr(null);
    setFileToUpload(null);
    setUploadPreview(null);
    setInputMode("url");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function loadForEdit(id: string) {
    const res = await fetch(`/api/admin/posters/${id}`);
    if (!res.ok) return;
    const d = await res.json().catch(() => ({}));
    const p = d.poster;
    setSelectedId(id);
    setTitle(p.title);
    setImageUrl(p.imageUrl);
    setCtaText(p.ctaText ?? "");
    setCtaHref(p.ctaHref ?? "");
    setInputMode("url");
    setFileToUpload(null);
    setUploadPreview(null);
    setErr(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileToUpload(file);
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadPreview(file ? URL.createObjectURL(file) : null);
    setErr(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    let finalImageUrl = imageUrl;

    if (inputMode === "file") {
      if (!fileToUpload) {
        setErr("Please select an image file.");
        setSaving(false);
        return;
      }
      const form = new FormData();
      form.append("file", fileToUpload);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      if (!uploadRes.ok) {
        const d = await uploadRes.json().catch(() => ({}));
        setErr(d.error ?? "Upload failed.");
        setSaving(false);
        return;
      }
      const { url } = await uploadRes.json();
      finalImageUrl = url;
    }

    const payload = {
      title,
      imageUrl: finalImageUrl,
      ctaText: ctaText || undefined,
      ctaHref: ctaHref || undefined
    };

    const res = await fetch(
      selectedId ? `/api/admin/posters/${selectedId}` : "/api/admin/posters",
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
    if (!confirm("Delete this poster? This cannot be undone.")) return;
    await fetch(`/api/admin/posters/${id}`, { method: "DELETE" });
    if (selectedId === id) resetForm();
    await refresh();
  }

  const previewSrc = inputMode === "file" ? uploadPreview : (imageUrl || null);

  return (
    <AdminShell active="posters">
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Poster manager</h1>
          <p className="mt-2 text-slate-600">Add and manage attractive posters for the home page.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold">{selectedId ? "Edit poster" : "Add poster"}</h2>
            {selectedId && <Button variant="ghost" onClick={resetForm}>+ New poster</Button>}
          </div>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <div>
              <label className="text-sm font-semibold">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            {/* Image input toggle */}
            <div>
              <label className="mb-1 block text-sm font-semibold">Image</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode("url")}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${inputMode === "url" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("file")}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${inputMode === "file" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  Upload file
                </button>
              </div>

              {inputMode === "url" ? (
                <div className="mt-2">
                  <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} type="url" required placeholder="https://example.com/image.jpg" />
                  <p className="mt-1 text-xs text-slate-500">Tip: use a high-res HTTPS image URL.</p>
                </div>
              ) : (
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                    required={!selectedId}
                  />
                  <p className="mt-1 text-xs text-slate-500">JPEG, PNG, WebP or GIF · max 5 MB</p>
                </div>
              )}
            </div>

            {/* Image preview */}
            {previewSrc && (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
                {inputMode === "file" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <Image src={previewSrc} alt="Preview" fill className="object-cover" sizes="400px" />
                )}
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold">CTA Text (optional)</label>
                <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold">CTA Link (optional)</label>
                <Input value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} placeholder="/classes" />
              </div>
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex gap-2">
              <Button className="flex-1" disabled={saving}>{saving ? "Saving…" : selectedId ? "Save changes" : "Add"}</Button>
              {selectedId && <Button variant="secondary" type="button" onClick={resetForm}>Cancel</Button>}
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-extrabold">Existing posters</h2>
          <div className="mt-4 space-y-3">
            {items.length === 0 && <p className="text-sm text-slate-600">No posters yet.</p>}
            {items.map((p) => (
              <div key={p.id} className={`rounded-2xl border overflow-hidden ${selectedId === p.id ? "border-brand-400" : "border-slate-100"}`}>
                <div className="relative aspect-[16/9] w-full">
                  <Image src={p.imageUrl} alt={p.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
                </div>
                <div className="p-4">
                  <p className="font-extrabold">{p.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(p.createdAt).toLocaleString()}</p>
                  <div className="mt-3 flex gap-3">
                    <button onClick={() => loadForEdit(p.id)} className="text-sm font-semibold text-brand-700">Edit</button>
                    <button onClick={() => remove(p.id)} className="text-sm font-semibold text-red-600">Delete</button>
                  </div>
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
