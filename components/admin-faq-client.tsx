"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-client";

type Category = "GENERAL" | "COURSES" | "REGISTRATION" | "RECORDINGS";
type Faq = { id: string; question: string; answer: string; category: Category; position: number };
type Form = Omit<Faq, "id">;
const blank: Form = { question: "", answer: "", category: "GENERAL", position: 0 };
const names: Record<Category, string> = { GENERAL: "About the institute", COURSES: "Courses", REGISTRATION: "Registration", RECORDINGS: "Class recordings" };

export default function AdminFaqClient() {
  const [entries, setEntries] = useState<Faq[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/faq", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load the FAQs.");
      const d = await res.json();
      setEntries(d.entries ?? []);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function change<K extends keyof Form>(key: K, value: Form[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }
  function edit(entry: Faq) {
    setEditId(entry.id);
    setForm({ question: entry.question, answer: entry.answer, category: entry.category, position: entry.position });
    setError(""); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancel() { setEditId(null); setForm(blank); setError(""); }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const res = await fetch(editId ? `/api/faq/${editId}` : "/api/faq", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Could not save question");
      cancel(); setMessage(editId ? "Question updated." : "Question published."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setBusy(false); }
  }
  async function remove(entry: Faq) {
    if (!window.confirm(`Delete FAQ: "${entry.question}"? This cannot be undone.`)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const res = await fetch(`/api/faq/${entry.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete the question");
      if (editId === entry.id) cancel();
      setMessage("Question deleted."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); }
    finally { setBusy(false); }
  }

  return (
    <AdminShell active="faq">
      <div style={{ maxWidth: 960, padding: "clamp(16px, 4vw, 38px)", margin: "0 auto" }}>
        <div className="eyebrow">Content management</div>
        <h1 className="serif" style={{ fontSize: "clamp(28px, 4vw, 42px)", margin: "8px 0" }}>Frequently Asked Questions</h1>
        <p style={{ color: "var(--ink-3)", lineHeight: 1.7 }}>Add and maintain answers for prospective and enrolled students. Only admins can make changes. <a href="/faq" target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-700)" }}>View public FAQ ↗</a></p>
        <form onSubmit={save} className="surface" style={{ padding: "clamp(16px, 3vw, 26px)", display: "grid", gap: 16, margin: "24px 0" }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{editId ? "Edit question" : "Add a question"}</h2>
          <label className="label">Question *<input className="input" required minLength={5} maxLength={300} style={{ width: "100%", marginTop: 8 }} value={form.question} onChange={e => change("question", e.target.value)} placeholder="How do I register for a course?" /></label>
          <label className="label">Answer *<textarea className="input" required minLength={5} maxLength={5000} rows={5} style={{ width: "100%", lineHeight: 1.7, marginTop: 8 }} value={form.answer} onChange={e => change("answer", e.target.value)} placeholder="Explain the steps clearly…" /></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: 14 }}>
            <label className="label">Category<select className="input" value={form.category} style={{ width: "100%", marginTop: 8 }} onChange={e => change("category", e.target.value as Category)}>{Object.entries(names).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            <label className="label">Display order (lower first)<input className="input" type="number" min={0} max={10000} value={form.position} style={{ width: "100%", marginTop: 8 }} onChange={e => change("position", Number(e.target.value))} /></label>
          </div>
          {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
          {message && <p role="status" style={{ color: "var(--brand-700)" }}>{message}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : editId ? "Save changes" : "Publish question"}</button>
            {editId && <button type="button" className="btn btn-secondary" onClick={cancel} disabled={busy}>Cancel editing</button>}
          </div>
        </form>
        <h2 style={{ fontSize: 19, margin: "28px 0 16px" }}>Published questions ({entries.length})</h2>
        {loading ? <p>Loading…</p> : !entries.length ? <p style={{ color: "var(--ink-3)" }}>No questions yet. Add your first FAQ above.</p> : (
          <div style={{ display: "grid", gap: 12 }}>
            {entries.map(entry => (
              <div className="surface" key={entry.id} style={{ padding: "18px 20px", overflowWrap: "anywhere" }}>
                <div style={{ fontSize: 11, color: "var(--brand-700)", marginBottom: 8, textTransform: "uppercase", fontWeight: 700 }}>{names[entry.category]} · Order {entry.position}</div>
                <h3 style={{ fontSize: 15, margin: "0 0 8px" }}>{entry.question}</h3>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 13, color: "var(--ink-2)", margin: "0 0 14px" }}>{entry.answer}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => edit(entry)} disabled={busy}>Edit</button>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: "#b91c1c" }} onClick={() => remove(entry)} disabled={busy}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
