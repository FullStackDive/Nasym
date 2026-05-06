"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Icon, AppBar, Avatar } from "./ui";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  author: { id: string; name: string };
};

const BlogPostClient = ({ slug }: { slug: string }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [navTab, setNavTab] = useState("news");
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const role = session?.user?.role;
  const canEdit = role === "ADMIN" || (role === "TEACHER" && post?.author.id === session?.user?.id);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${slug}`);
      if (!res.ok) { setError("Post not found"); return; }
      setPost((await res.json()).post);
    } catch { setError("Failed to load"); }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const deletePost = async () => {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    const res = await fetch(`/api/blog/${slug}`, { method: "DELETE" });
    if (res.ok) router.push("/blog");
    else setDeleting(false);
  };

  const togglePublish = async () => {
    if (!post) return;
    const res = await fetch(`/api/blog/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !post.isPublished }),
    });
    if (res.ok) setPost((await res.json()).post);
  };

  if (loading) {
    return (
      <div className="app">
        <AppBar active={navTab} onNav={setNavTab} />
        <div className="app-scroll" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
          <div style={{ color:"var(--ink-3)" }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="app">
        <AppBar active={navTab} onNav={setNavTab} />
        <div className="app-scroll" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <div style={{ fontWeight:600 }}>{error || "Post not found"}</div>
            <button className="btn btn-secondary" style={{ marginTop:16 }} onClick={() => router.push("/blog")}>Back to blog</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <AppBar active={navTab} onNav={setNavTab} role={role as "ADMIN" | "STUDENT" | undefined} userName={session?.user?.name ?? undefined} />
      <div className="app-scroll">
        {post.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverUrl} alt={post.title} style={{ width:"100%", maxHeight:360, objectFit:"cover" }} />
        )}
        <div style={{ maxWidth:760, margin:"0 auto", padding:"36px 32px 80px" }}>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom:20 }} onClick={() => router.push("/blog")}>
            ← All posts
          </button>

          {!post.isPublished && (
            <div style={{ background:"color-mix(in oklch, var(--brand-500) 10%, transparent)", border:"1px solid var(--brand-200)", borderRadius:10, padding:"10px 16px", marginBottom:18, fontSize:13, color:"var(--brand-800)", fontWeight:600 }}>
              <Icon name="eye" size={13}/> Draft — not visible to students
            </div>
          )}

          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, fontSize:13, color:"var(--ink-3)" }}>
            <Avatar name={post.author.name} size={26} />
            <span>{post.author.name}</span>
            <span>·</span>
            <span>
              {(post.publishedAt ?? post.createdAt)
                ? new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })
                : ""}
            </span>
          </div>

          <h1 style={{ fontSize:38, fontWeight:800, margin:"0 0 28px", lineHeight:1.15 }}>{post.title}</h1>

          {post.excerpt && (
            <p style={{ fontSize:18, color:"var(--ink-2)", lineHeight:1.6, margin:"0 0 28px", fontStyle:"italic", borderLeft:"3px solid var(--brand-700)", paddingLeft:16 }}>{post.excerpt}</p>
          )}

          <div style={{ fontSize:16, lineHeight:1.85, color:"var(--ink-1)", whiteSpace:"pre-wrap" }}>{post.body}</div>

          {canEdit && (
            <div style={{ display:"flex", gap:10, marginTop:40, paddingTop:24, borderTop:"1px solid var(--hairline)" }}>
              <button className="btn btn-secondary btn-sm" onClick={togglePublish}>
                <Icon name="eye" size={13}/> {post.isPublished ? "Unpublish" : "Publish"}
              </button>
              <button className="btn btn-ghost btn-sm" style={{ color:"var(--danger,#e53e3e)" }} onClick={deletePost} disabled={deleting}>
                <Icon name="trash" size={13}/> {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPostClient;
