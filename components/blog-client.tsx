"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Icon, AppBar, Avatar } from "./ui";
import { Breeze, KhatamPattern } from "./motifs";
import { SITE_NAME } from "@/lib/site";

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

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  body: "",
  coverUrl: "",
  isPublished: true,
};

const BlogClient = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [navTab, setNavTab] = useState("blog");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const role = session?.user?.role;
  const canWrite = role === "ADMIN" || role === "TEACHER";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog", { cache: "no-store" });
      if (res.ok) setPosts((await res.json()).posts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createPost = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      setFormError("Title and body are required.");
      return;
    }

    setCreating(true);
    setFormError("");

    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          excerpt: form.excerpt.trim() || undefined,
          body: form.body.trim(),
          coverUrl: form.coverUrl.trim() || undefined,
          isPublished: form.isPublished,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? "Could not create the post.");
        return;
      }

      setForm(EMPTY_FORM);
      setShowForm(false);
      router.push(`/blog/${data.post.slug}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="app">
      <AppBar active={navTab} onNav={setNavTab} role="STUDENT" userName={session?.user?.name ?? undefined} />
      <div className="app-scroll">
        <section className="blog-hero">
          <Breeze opacity={0.16} color="var(--brand-500)" />
          <KhatamPattern opacity={0.025} color="var(--brand-700)" style={{ position: "absolute", inset: 0 }} />
          <div className="blog-hero-inner">
            <div className="eyebrow">{SITE_NAME}</div>
            <h1 className="serif">Blog</h1>
            <p>Reflections, lessons, guidance, and institute updates — presented with the same calm learning experience as the rest of Nasym.</p>
          </div>
        </section>

        <main className="blog-page-wrap">
          {canWrite && (
            <div className="blog-toolbar">
              <div>
                <div className="eyebrow">Publishing</div>
                <p>Admins and teachers can create posts. Teachers can manage their own posts; admins can manage all posts.</p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowForm((visible) => !visible);
                  setFormError("");
                }}
              >
                <Icon name="plus" size={14} /> {showForm ? "Close editor" : "New blog post"}
              </button>
            </div>
          )}

          {showForm && canWrite && (
            <section className="surface blog-editor-card">
              <div className="blog-editor-heading">
                <div>
                  <div className="eyebrow">New post</div>
                  <h2 className="serif">Create a blog post</h2>
                </div>
                <span className="chip chip-brand">Admin / Teacher</span>
              </div>

              {formError && <div className="blog-form-error">{formError}</div>}

              <div className="blog-editor-grid">
                <div>
                  <label className="label">Title *</label>
                  <input
                    className="input"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Post title"
                  />
                </div>
                <div>
                  <label className="label">Excerpt</label>
                  <input
                    className="input"
                    value={form.excerpt}
                    onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                    placeholder="A short summary shown on the blog page"
                  />
                </div>
                <div>
                  <label className="label">Cover image URL (optional)</label>
                  <input
                    className="input"
                    value={form.coverUrl}
                    onChange={(e) => setForm((f) => ({ ...f, coverUrl: e.target.value }))}
                    placeholder="https://..."
                    inputMode="url"
                  />
                </div>
                <div>
                  <label className="label">Article *</label>
                  <textarea
                    className="input blog-body-editor"
                    rows={16}
                    value={form.body}
                    onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder={"Write your article here.\n\n## Section heading\n### Subheading\n> Highlighted quote"}
                  />
                  <p className="blog-editor-help">Use <strong>##</strong> for section headings, <strong>###</strong> for subheadings, <strong>&gt;</strong> for a highlighted quote, and <strong>-</strong> for bullet points. Content is rendered safely as text.</p>
                </div>
                <label className="blog-publish-toggle">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                  />
                  <span>
                    <strong>Publish immediately</strong>
                    <small>Turn this off to save the post as a draft.</small>
                  </span>
                </label>
              </div>

              <div className="blog-editor-actions">
                <button
                  className="btn btn-primary"
                  onClick={createPost}
                  disabled={creating || !form.title.trim() || !form.body.trim()}
                >
                  {creating ? "Saving…" : form.isPublished ? "Publish post" : "Save draft"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setForm(EMPTY_FORM);
                    setFormError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </section>
          )}

          {loading ? (
            <div className="blog-empty-state">Loading blog posts…</div>
          ) : posts.length === 0 ? (
            <div className="surface blog-empty-state">No blog posts have been published yet.</div>
          ) : (
            <div className="blog-list">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="surface blog-list-card"
                  onClick={() => router.push(`/blog/${post.slug}`)}
                >
                  <div className="blog-card-media">
                    {post.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.coverUrl} alt="" />
                    ) : (
                      <>
                        <Breeze opacity={0.25} color="var(--brand-500)" />
                        <div className="blog-card-media-icon"><Icon name="book" size={28} stroke={1.4} /></div>
                      </>
                    )}
                  </div>

                  <div className="blog-card-content">
                    <div className="blog-card-meta">
                      {!post.isPublished && <span className="chip chip-brand">Draft</span>}
                      <span>
                        {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h2 className="serif">{post.title}</h2>
                    {post.excerpt && <p>{post.excerpt}</p>}

                    <div className="blog-card-author">
                      <Avatar name={post.author.name} size={26} />
                      <span>{post.author.name}</span>
                      <span className="blog-read-more">Read article <Icon name="arrow-right" size={13} /></span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BlogClient;
