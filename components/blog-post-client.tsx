"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Icon, AppBar, Avatar } from "./ui";
import { Breeze } from "./motifs";
import BlogArticleContent from "./blog-article-content";

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
  updatedAt: string;
  author: { id: string; name: string };
};

type EditForm = {
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string;
};

const BlogPostClient = ({ slug }: { slug: string }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [navTab, setNavTab] = useState("blog");
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", excerpt: "", body: "", coverUrl: "" });
  const [saving, setSaving] = useState(false);
  const [manageError, setManageError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const role = session?.user?.role;
  const canEdit = role === "ADMIN" || (role === "TEACHER" && post?.author.id === session?.user?.id);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/blog/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        setError("Post not found");
        return;
      }
      const loaded = (await res.json()).post as Post;
      setPost(loaded);
    } catch {
      setError("Failed to load this post.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const startEditing = () => {
    if (!post) return;
    setEditForm({
      title: post.title,
      excerpt: post.excerpt ?? "",
      body: post.body,
      coverUrl: post.coverUrl ?? "",
    });
    setManageError("");
    setEditing(true);
  };

  const saveChanges = async () => {
    if (!post || !editForm.title.trim() || !editForm.body.trim()) return;
    setSaving(true);
    setManageError("");

    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title.trim(),
          excerpt: editForm.excerpt.trim(),
          body: editForm.body.trim(),
          coverUrl: editForm.coverUrl.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setManageError(data.error ?? "Could not save changes.");
        return;
      }

      setPost(data.post);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!post) return;
    setManageError("");

    const res = await fetch(`/api/blog/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !post.isPublished }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) setPost(data.post);
    else setManageError(data.error ?? "Could not update publication status.");
  };

  const deletePost = async () => {
    if (!post || deleteText !== post.title) return;

    setDeleting(true);
    setManageError("");

    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmTitle: deleteText }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push("/blog");
        return;
      }

      setManageError(data.error ?? "Could not delete this post.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="app">
        <AppBar active="blog" />
        <div className="app-scroll blog-loading-state">Loading article…</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="app">
        <AppBar active="blog" />
        <div className="app-scroll blog-loading-state">
          <div className="surface blog-not-found">
            <Icon name="book" size={30} />
            <h2 className="serif">{error || "Post not found"}</h2>
            <button className="btn btn-secondary" onClick={() => router.push("/blog")}>Back to blog</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <AppBar active={navTab} onNav={setNavTab} role={role as "ADMIN" | "STUDENT" | undefined} userName={session?.user?.name ?? undefined} />
      <div className="app-scroll">
        <section className="blog-post-hero">
          <Breeze opacity={0.13} color="var(--brand-500)" />
          <div className="blog-post-hero-inner">
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/blog")}>← All blog posts</button>

            {!post.isPublished && (
              <div className="blog-draft-banner">
                <Icon name="eye" size={13} /> Draft — only you and administrators can view this unpublished post.
              </div>
            )}

            <div className="blog-post-meta">
              <Avatar name={post.author.name} size={30} />
              <span>{post.author.name}</span>
              <span>·</span>
              <span>
                {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <h1 className="serif">{post.title}</h1>
            {post.excerpt && <p className="blog-post-excerpt">{post.excerpt}</p>}
          </div>
        </section>

        {post.coverUrl && (
          <div className="blog-cover-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverUrl} alt={post.title} />
          </div>
        )}

        <main className="blog-post-wrap">
          {editing && canEdit ? (
            <section className="surface blog-editor-card">
              <div className="blog-editor-heading">
                <div>
                  <div className="eyebrow">Editing</div>
                  <h2 className="serif">Edit blog post</h2>
                </div>
                <span className="chip chip-brand">{role === "ADMIN" ? "Administrator" : "Author"}</span>
              </div>

              {manageError && <div className="blog-form-error">{manageError}</div>}

              <div className="blog-editor-grid">
                <div>
                  <label className="label">Title *</label>
                  <input className="input" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Excerpt</label>
                  <input className="input" value={editForm.excerpt} onChange={(e) => setEditForm((f) => ({ ...f, excerpt: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Cover image URL (optional)</label>
                  <input className="input" value={editForm.coverUrl} onChange={(e) => setEditForm((f) => ({ ...f, coverUrl: e.target.value }))} inputMode="url" />
                </div>
                <div>
                  <label className="label">Article *</label>
                  <textarea className="input blog-body-editor" rows={18} value={editForm.body} onChange={(e) => setEditForm((f) => ({ ...f, body: e.target.value }))} />
                  <p className="blog-editor-help">Formatting: ## section heading, ### subheading, &gt; highlighted quote, - bullet point.</p>
                </div>
              </div>

              <div className="blog-editor-actions">
                <button className="btn btn-primary" onClick={saveChanges} disabled={saving || !editForm.title.trim() || !editForm.body.trim()}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button className="btn btn-secondary" onClick={() => { setEditing(false); setManageError(""); }}>Cancel</button>
              </div>
            </section>
          ) : (
            <article className="surface blog-article-surface">
              <BlogArticleContent body={post.body} />
            </article>
          )}

          {canEdit && !editing && (
            <section className="surface blog-manage-panel">
              <div>
                <div className="eyebrow">Post controls</div>
                <h2 className="serif">Manage this post</h2>
                <p>{role === "ADMIN" ? "As an administrator, you can edit or remove this post." : "You can edit or remove posts that you authored."}</p>
              </div>

              {manageError && <div className="blog-form-error">{manageError}</div>}

              <div className="blog-manage-actions">
                <button className="btn btn-secondary btn-sm" onClick={startEditing}>
                  <Icon name="edit" size={13} /> Edit
                </button>
                <button className="btn btn-secondary btn-sm" onClick={togglePublish}>
                  <Icon name="eye" size={13} /> {post.isPublished ? "Unpublish" : "Publish"}
                </button>
                <button className="btn btn-ghost btn-sm blog-delete-button" onClick={() => { setShowDelete(true); setDeleteText(""); }}>
                  <Icon name="trash" size={13} /> Delete
                </button>
              </div>

              {showDelete && (
                <div className="blog-delete-confirm">
                  <div>
                    <strong>Confirm permanent deletion</strong>
                    <p>Type the exact post title below. This extra step prevents accidental deletion.</p>
                  </div>
                  <code>{post.title}</code>
                  <input
                    className="input"
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    placeholder="Type the exact title"
                    autoComplete="off"
                  />
                  <div className="blog-editor-actions">
                    <button
                      className="btn btn-sm blog-danger-action"
                      disabled={deleting || deleteText !== post.title}
                      onClick={deletePost}
                    >
                      {deleting ? "Deleting…" : "Permanently delete post"}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setShowDelete(false); setDeleteText(""); }}>Cancel</button>
                  </div>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default BlogPostClient;
