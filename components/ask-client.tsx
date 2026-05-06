"use client";

import { useState } from "react";
import { AppBar } from "./ui";
import { KhatamPattern } from "./motifs";

const AskClient = () => {
  const [navTab, setNavTab] = useState("news");
  const [form, setForm] = useState({ name: "", email: "", subject: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.body.trim()) {
      setError("All fields are required."); return;
    }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setDone(true); }
      else {
        const d = await res.json();
        setError(d.error ?? "Failed to submit. Please try again.");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="app">
      <AppBar active={navTab} onNav={setNavTab} />
      <div className="app-scroll">
        {/* Hero */}
        <div style={{ position:"relative", background:"linear-gradient(135deg, var(--brand-700), var(--brand-900))", padding:"56px 32px 44px", overflow:"hidden" }}>
          <KhatamPattern opacity={0.1} color="white" style={{ position:"absolute", inset:0 }} />
          <div style={{ position:"relative", maxWidth:700, margin:"0 auto", color:"white", textAlign:"center" }}>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", opacity:0.7, marginBottom:10 }}>Ask Us</div>
            <h1 style={{ fontSize:38, fontWeight:800, margin:"0 0 10px", lineHeight:1.15 }}>Have a question?</h1>
            <p style={{ fontSize:16, opacity:0.8, margin:0, lineHeight:1.6 }}>
              Submit your question and our teachers will reply by email at their earliest convenience.
            </p>
          </div>
        </div>

        <div style={{ maxWidth:640, margin:"0 auto", padding:"48px 32px 80px" }}>
          {done ? (
            <div className="surface" style={{ padding:40, textAlign:"center" }}>
              <div style={{ fontSize:44, marginBottom:16 }}>✅</div>
              <h2 style={{ fontSize:22, fontWeight:800, marginBottom:8 }}>Question submitted!</h2>
              <p style={{ color:"var(--ink-2)", lineHeight:1.6, margin:"0 0 24px" }}>
                JazākAllāh khayran. We have received your question and will reply to <strong>{form.email}</strong> within a few days, in shā Allāh.
              </p>
              <button className="btn btn-secondary" onClick={() => { setDone(false); setForm({ name:"", email:"", subject:"", body:"" }); }}>
                Submit another question
              </button>
            </div>
          ) : (
            <div className="surface" style={{ padding:36 }}>
              <h2 style={{ fontSize:20, fontWeight:800, marginBottom:24 }}>Your question</h2>
              {error && (
                <div style={{ background:"color-mix(in oklch, #e53e3e 10%, transparent)", border:"1px solid color-mix(in oklch, #e53e3e 25%, transparent)", borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#c53030" }}>
                  {error}
                </div>
              )}
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label className="label">Your name *</label>
                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ahmad Ali" />
                  </div>
                  <div>
                    <label className="label">Email address *</label>
                    <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" />
                  </div>
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <input className="input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Question about prayer times" />
                </div>
                <div>
                  <label className="label">Your question *</label>
                  <textarea
                    className="input"
                    rows={8}
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Please describe your question in detail…"
                    style={{ resize:"vertical" }}
                  />
                </div>
                <div style={{ fontSize:12, color:"var(--ink-3)", lineHeight:1.6 }}>
                  Your question and contact details will be kept private. Our response will be sent to the email address you provide.
                </div>
                <div>
                  <button className="btn btn-primary" onClick={submit} disabled={submitting || !form.name.trim() || !form.email.trim() || !form.body.trim()}>
                    {submitting ? "Submitting…" : "Submit question"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AskClient;
