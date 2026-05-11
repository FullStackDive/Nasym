"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, AppBar } from "./ui";
import { Breeze, LeafSprig } from "./motifs";

type Lesson = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  tags?: string | null;
  createdAt: string;
};

type SortKey = "recent" | "oldest" | "title";

const HUES = ["deep", "mid", "camel", "mint"] as const;
const hueBg = (h: string) =>
  h === "deep" ? "linear-gradient(135deg, var(--brand-700), var(--brand-900))"
  : h === "mid" ? "linear-gradient(135deg, var(--c-mid), var(--brand-700))"
  : h === "camel" ? "linear-gradient(135deg, var(--accent-500), var(--accent-600))"
  : "linear-gradient(135deg, var(--mint-300), var(--c-mid))";

function lessonHue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

function parseTags(t?: string | null): string[] {
  return (t ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

function isRecent(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < 14 * 24 * 3600 * 1000;
}

const LessonsClient = () => {
  const router = useRouter();
  const [tab, setTab] = useState("lessons");
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [activeTag, setActiveTag] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [pickedTags, setPickedTags] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/public/lessons")
      .then(r => r.ok ? r.json() : { lessons: [] })
      .then(d => setLessons(d.lessons ?? []))
      .catch(() => setLessons([]));
  }, []);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    (lessons ?? []).forEach(l => parseTags(l.tags).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [lessons]);

  const tagChips = useMemo(() => ["All", ...allTags.slice(0, 8)], [allTags]);

  const filtered = useMemo(() => {
    if (!lessons) return [];
    let list = lessons.slice();
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (l.tags ?? "").toLowerCase().includes(q)
      );
    }
    if (activeTag !== "All") {
      list = list.filter(l => parseTags(l.tags).some(t => t.toLowerCase() === activeTag.toLowerCase()));
    }
    if (pickedTags.length) {
      list = list.filter(l => {
        const lt = parseTags(l.tags).map(t => t.toLowerCase());
        return pickedTags.every(p => lt.includes(p.toLowerCase()));
      });
    }
    if (sort === "recent") list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (sort === "oldest") list.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    else if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [lessons, search, activeTag, pickedTags, sort]);

  return (
    <div className="app">
      <AppBar active={tab} onNav={setTab} />
      <div className="app-scroll">
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 64px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom: 26, gap: 16, flexWrap: "wrap" }}>
            <div>
              <div className="eyebrow">{lessons === null ? "Loading…" : `${lessons.length} lesson${lessons.length === 1 ? "" : "s"}`}</div>
              <h1 className="serif" style={{ fontSize: 48, fontWeight: 500, letterSpacing:"-0.025em", margin: "8px 0 0" }}>Lessons library</h1>
              <p style={{ color:"var(--ink-3)", marginTop: 8, fontSize: 15 }}>Watch, take notes, and earn XP. Filter by series, level, or teacher.</p>
            </div>
            <div style={{ display:"flex", gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setShowFilters(true)}><Icon name="filter" size={14}/> Filters{pickedTags.length ? ` (${pickedTags.length})` : ""}</button>
              <button className={"btn " + (sort === "recent" ? "btn-primary" : "btn-secondary")} onClick={() => setSort(s => s === "recent" ? "title" : "recent")}>
                {sort === "recent" ? "Recently added ✓" : "Recently added"}
              </button>
            </div>
          </div>

          <div style={{ position: "relative", maxWidth: 460, marginBottom: 18 }}>
            <span style={{ position:"absolute", left: 14, top: "50%", transform:"translateY(-50%)", color:"var(--ink-3)", lineHeight: 0 }}>
              <Icon name="search" size={16} />
            </span>
            <input className="input" style={{ paddingLeft: 40 }} placeholder="Search lessons…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {tagChips.length > 1 && (
            <div style={{ display:"flex", gap: 8, flexWrap:"wrap", marginBottom: 26 }}>
              {tagChips.map(s => (
                <button key={s} onClick={() => setActiveTag(s)} className={"btn btn-sm " + (activeTag === s ? "btn-primary" : "btn-secondary")}>{s}</button>
              ))}
            </div>
          )}

          {lessons === null ? (
            <div style={{ color: "var(--ink-3)", fontSize: 15 }}>Loading lessons…</div>
          ) : filtered.length === 0 ? (
            <div className="surface" style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {lessons.length === 0 ? "No lessons published yet" : "No lessons match your filters"}
              </div>
              <p style={{ color: "var(--ink-3)", fontSize: 14 }}>
                {lessons.length === 0 ? "Check back soon — new lessons are added each week." : "Try clearing filters or a different search."}
              </p>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {filtered.map(l => {
                const tags = parseTags(l.tags);
                const hue = lessonHue(l.id);
                return (
                  <button key={l.id} onClick={() => router.push(`/lessons/${l.id}`)} className="card" style={{ overflow:"hidden", textAlign:"left", cursor:"pointer", padding: 0, fontFamily:"inherit", color:"inherit" }}>
                    <div style={{ position:"relative", aspectRatio: "16/9", background: hueBg(hue) }}>
                      <Breeze opacity={0.3} color="white" />
                      <div style={{ position:"absolute", inset: 0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ width: 48, height: 48, borderRadius:999, background:"rgba(255,255,255,0.92)", color:"var(--brand-800)", display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="play" size={20}/></span>
                      </div>
                      {isRecent(l.createdAt) && <span className="chip chip-camel" style={{ position:"absolute", top: 12, left: 12 }}>NEW</span>}
                    </div>
                    <div className="card-pad">
                      {tags[0] && <div className="eyebrow" style={{ color:"var(--ink-3)" }}>{tags[0]}</div>}
                      <h3 className="serif" style={{ margin: "8px 0 6px", fontSize: 19, fontWeight: 500, letterSpacing:"-0.01em", lineHeight: 1.2 }}>{l.title}</h3>
                      <p style={{ margin: 0, color:"var(--ink-3)", fontSize: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{l.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <FiltersModal
          allTags={allTags}
          picked={pickedTags}
          sort={sort}
          onApply={(p, s) => { setPickedTags(p); setSort(s); setShowFilters(false); }}
          onClear={() => { setPickedTags([]); setActiveTag("All"); setSort("recent"); setShowFilters(false); }}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
};

const FiltersModal = ({ allTags, picked, sort, onApply, onClear, onClose }: {
  allTags: string[];
  picked: string[];
  sort: SortKey;
  onApply: (picked: string[], sort: SortKey) => void;
  onClear: () => void;
  onClose: () => void;
}) => {
  const [localPicked, setLocalPicked] = useState<string[]>(picked);
  const [localSort, setLocalSort] = useState<SortKey>(sort);

  function toggle(tag: string) {
    setLocalPicked(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,32,40,0.55)", zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "10vh 16px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, background: "var(--surface)", borderRadius: 18, border: "1px solid var(--hairline)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "20px 26px", borderBottom: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 className="serif" style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>Filters</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close" style={{ padding: "6px 10px" }}>✕</button>
        </div>
        <div style={{ padding: 26 }}>
          <h3 className="eyebrow" style={{ marginBottom: 10 }}>Sort by</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
            {([["recent", "Recently added"], ["oldest", "Oldest first"], ["title", "Title (A–Z)"]] as [SortKey, string][]).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setLocalSort(k)} className={"btn btn-sm " + (localSort === k ? "btn-primary" : "btn-secondary")}>{l}</button>
            ))}
          </div>

          <h3 className="eyebrow" style={{ marginBottom: 10 }}>Tags ({localPicked.length} selected)</h3>
          {allTags.length === 0 ? (
            <p style={{ color: "var(--ink-3)", fontSize: 13, margin: 0 }}>No tags yet.</p>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", maxHeight: 220, overflowY: "auto" }}>
              {allTags.map(t => (
                <button key={t} type="button" onClick={() => toggle(t)} className={"btn btn-sm " + (localPicked.includes(t) ? "btn-primary" : "btn-secondary")}>{t}</button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26 }}>
            <button type="button" className="btn btn-ghost" onClick={onClear}>Clear all</button>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={() => onApply(localPicked, localSort)}>Apply</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonsClient;
