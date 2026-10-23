"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-client";

type Form = { arabic: string; translit: string; meaning: string; reference: string };
const empty: Form = { arabic: "", translit: "", meaning: "", reference: "" };

export default function AdminAyahClient() {
  const [form, setForm] = useState<Form>(empty);
  const [custom, setCustom] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/admin/ayah").then(async r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => {
        const ayah = d.saved ? { arabic: d.saved.arabic, translit: d.saved.translit, meaning: d.saved.meaning, reference: d.saved.reference }
          : { ...d.suggested, reference: d.suggested.ref };
        setForm(ayah);
        setCustom(Boolean(d.saved));
      })
      .catch(() => setError("Could not load the current ayah."));
  }, []);
  const change = (key: keyof Form, value: string) => setForm(s => ({ ...s, [key]: value }));
  async function save() {
    setBusy(true); setMessage(""); setError("");
    try {
      const res = await fetch("/api/admin/ayah", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Save failed");
      setCustom(true); setMessage("Featured ayah updated successfully on the homepage.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save."); }
    finally { setBusy(false); }
  }
  async function reset() {
    if (!window.confirm("Resume automatically rotating the daily ayah?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const r = await fetch("/api/admin/ayah", { method: "DELETE" });
      if (!r.ok) throw new Error("Could not restore the daily rotation");
      const current = await fetch("/api/admin/ayah").then(x => x.json());
      setForm({ ...current.suggested, reference: current.suggested.ref });
      setCustom(false); setMessage("Automatic daily rotation restored.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not restore rotation."); }
    finally { setBusy(false); }
  }
  return (
    <AdminShell active="ayah">
      <div style={{ maxWidth: 850, padding: "clamp(16px, 4vw, 38px)", margin: "0 auto" }}>
        <div className="eyebrow">Website content</div>
        <h1 className="serif" style={{ fontSize: "clamp(28px, 4vw, 42px)", margin: "8px 0" }}>Āyah of the Day</h1>
        <p style={{ color: "var(--ink-3)", lineHeight: 1.7 }}>Update the verse displayed on the homepage. {custom ? "A custom verse is currently featured." : "The original automatic daily rotation is active."}</p>
        <div className="surface" style={{ display: "grid", gap: 16, padding: "clamp(16px, 3vw, 26px)", marginTop: 24 }}>
          <label className="label">Arabic āyah *<textarea className="input arabic" dir="rtl" rows={3} value={form.arabic} onChange={e => change("arabic", e.target.value)} style={{ width: "100%", marginTop: 8, fontSize: 23, lineHeight: 1.8 }} /></label>
          <label className="label">English translation *<textarea className="input" rows={3} value={form.meaning} onChange={e => change("meaning", e.target.value)} style={{ width: "100%", marginTop: 8, lineHeight: 1.6 }} /></label>
          <label className="label">Sūrah and verse reference *<input className="input" value={form.reference} onChange={e => change("reference", e.target.value)} placeholder="Sūrah al-Baqarah · 2:286" style={{ width: "100%", marginTop: 8 }} /></label>
          <label className="label">Transliteration (optional)<textarea className="input" rows={2} value={form.translit} onChange={e => change("translit", e.target.value)} style={{ width: "100%", marginTop: 8 }} /></label>
          {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
          {message && <p role="status" style={{ color: "var(--brand-700)" }}>{message}</p>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={save} disabled={busy || !form.arabic.trim() || !form.meaning.trim() || !form.reference.trim()}>{busy ? "Saving…" : "Publish ayah"}</button>
            {custom && <button type="button" className="btn btn-secondary" onClick={reset} disabled={busy}>Restore daily rotation</button>}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
