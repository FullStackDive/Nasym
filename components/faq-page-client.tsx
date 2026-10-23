"use client";

import { useEffect, useMemo, useState } from "react";
import { AppBar } from "@/components/ui";

type Entry = { id: string; question: string; answer: string; category: string; position: number };
const categories: Record<string, string> = {
  GENERAL: "About the institute",
  COURSES: "Courses",
  REGISTRATION: "Registration",
  RECORDINGS: "Class recordings",
};

export default function FaqPageClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  useEffect(() => {
    fetch("/api/faq", { cache: "no-store" })
      .then(async r => { if (!r.ok) throw new Error("request failed"); return r.json(); })
      .then(d => setEntries(d.entries ?? []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);
  const visible = useMemo(() => entries.filter(e =>
    (filter === "ALL" || e.category === filter) &&
    (e.question + " " + e.answer).toLowerCase().includes(search.toLowerCase())
  ), [entries, filter, search]);

  return (
    <div className="app">
      <AppBar active="faq" showSearch={false} />
      <main className="app-scroll">
        <section style={{ padding: "clamp(36px, 7vw, 76px) 16px 80px", maxWidth: 930, margin: "0 auto" }}>
          <div className="eyebrow">Here to help</div>
          <h1 className="serif" style={{ fontSize: "clamp(34px, 6vw, 58px)", lineHeight: 1.13, color: "var(--brand-800)", margin: "12px 0 16px" }}>Frequently Asked Questions</h1>
          <p style={{ color: "var(--ink-2)", fontSize: 16, lineHeight: 1.8, margin: "0 0 28px" }}>Find answers about the institute, learning with us, registration, and class recordings.</p>
          <label htmlFor="faq-search" className="label">Search questions</label>
          <input id="faq-search" className="input" style={{ width: "100%", margin: "8px 0 20px" }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for an answer…" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {Object.entries({ ALL: "All", ...categories }).map(([key, label]) => (
              <button type="button" key={key} className={filter === key ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"} onClick={() => setFilter(key)} aria-pressed={filter === key}>{label}</button>
            ))}
          </div>
          {loading ? <p>Loading questions…</p> : failed ? <p role="alert">Questions could not be loaded. Please try again later.</p> : visible.length === 0 ? (
            <div className="surface" style={{ padding: 26, color: "var(--ink-2)" }}>{entries.length ? "No matching questions." : "Our FAQs are being prepared. Please check back soon."}</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {visible.map(entry => (
                <details key={entry.id} className="surface" style={{ padding: "18px 20px", overflowWrap: "anywhere" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 700, lineHeight: 1.5, color: "var(--brand-800)" }}>{entry.question}</summary>
                  <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.85, color: "var(--ink-2)", marginBottom: 0 }}>{entry.answer}</p>
                </details>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
