"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Icon, AppBar, Avatar } from "./ui";
import { KhatamPattern } from "./motifs";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  author: { id: string; name: string };
};

const BlogClient = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [navTab, setNavTab] = useState("news");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", excerpt: "", body: "", coverUrl: "", isPublished: true });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const role = session?.user?.role;
  const canWrite = role === "ADMIN" || role === "TEACHER";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog");
      if (res.ok) setPosts((await res.json()).posts);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createPost = async () => {
    if (!form.title.trim() || !form.body.trim()) { setFormError("Title and body are required."); return; }
    setCreating(true); setFormError("");
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, excerpt: form.excerpt || undefined, body: form.body, coverUrl: form.coverUrl || undefined, isPublished: form.isPublished }),
      });
      if (res.ok) {
        const { post } = await res.json();
        router.push(`/blog/${post.slug}`);
      } else {
        const d = await res.json();
        setFormError(d.error ?? "Failed to create");
      }
    } finally { setCreating(false); }
  };

  return (
    <div className="app">
      <AppBar active={navTab} onNav={setNavTab} role={role as "ADMIN" | "STUDENT" | undefined} userName={session?.user?.name ?? undefined} />
      <div className="app-scroll">
        {/* Hero */}
        <div style={{ position:"relative", background:"linear-gradient(135deg, var(--brand-700), var(--brand-900))", padding:"56px 32px 44px", overflow:"hidden" }}>
          <KhatamPattern opacity={0.1} color="white" style={{ position:"absolute", inset:0 }} />
          <div style={{ position:"relative", maxWidth:800, margin:"0 auto", color:"white" }}>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", opacity:0.7, marginBottom:10 }}>Nasym-ur-Rahmah</div>
            <h1 style={{ fontSize:42, fontWeight:800, margin:"0 0 10px", lineHeight:1.15 }}>The Blog</h1>
            <p style={{ fontSize:16, opacity:0.8, margin:0 }}>Reflections, lessons, and insights from our teachers</p>
          </div>
        </div>

        <div style={{ maxWidth:860, margin:"0 auto", padding:"36px 32px 80px" }}>
          {canWrite && (
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:24 }}>
              <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
                <Icon name="plus" size={14}/> New post
              </button>
            </div>
          )}

          {showForm && canWrite && (
            <div className="surface" style={{ padding:28, marginBottom:28 }}>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:18 }}>New blog post</div>
              {formError && <div style={{ color:"#e53e3e", fontSize:13, marginBottom:12 }}>{formError}</div>}
              <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:16 }}>
                <div>
                  <label className="label">Title *</label>
                  <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Understanding the Five Pillars" />
                </div>
                <div>
                  <label className="label">Excerpt (shown in listing)</label>
                  <input className="input" value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="One-line summary…" />
                </div>
                <div>
                  <label className="label">Cover image URL (optional)</label>
                  <input className="input" value={form.coverUrl} onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))} placeholder="https://…" />
                </div>
                <div>
                  <label className="label">Body *</label>
                  <textarea className="input" rows={12} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Write your article here… Markdown is preserved as plain text." style={{ resize:"vertical", fontFamily:"inherit" }} />
                </div>
                <div>
                  <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:14, fontWeight:600 }}>
                    <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
                    Publish immediately
                  </label>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-primary" onClick={createPost} disabled={creating || !form.title.trim()}>
                  {creating ? "Creating…" : "Publish post"}
                </button>
                <button className="btn btn-ghost" onClick={() => { setShowForm(false); setFormError(""); }}>Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign:"center", padding:64, color:"var(--ink-3)" }}>Loading…</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign:"center", padding:64, color:"var(--ink-3)" }}>No posts yet.</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {posts.map(post => (
                <article
                  key={post.id}
                  className="surface"
                  style={{ display:"flex", gap:0, overflow:"hidden", cursor:"pointer" }}
                  onClick={() => router.push(`/blog/${post.slug}`)}
                >
                  {post.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.coverUrl} alt={post.title} style={{ width:200, objectFit:"cover", flexShrink:0 }} />
                  )}
                  <div style={{ padding:"22px 24px", flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                      {!post.isPublished && <span className="chip" style={{ fontSize:10 }}>Draft</span>}
                      <span style={{ fontSize:12, color:"var(--ink-3)" }}>
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })
                          : new Date(post.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })
                        }
                      </span>
                    </div>
                    <h2 style={{ fontSize:20, fontWeight:800, margin:"0 0 8px", lineHeight:1.25 }}>{post.title}</h2>
                    {post.excerpt && <p style={{ margin:"0 0 14px", fontSize:14, color:"var(--ink-2)", lineHeight:1.6 }}>{post.excerpt}</p>}
                    <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--ink-3)" }}>
                      <Avatar name={post.author.name} size={22} />
                      <span>{post.author.name}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogClient;
