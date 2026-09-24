"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, LogoMark, AppBar } from "./ui";
import { Breeze, KhatamPattern, LeafSprig } from "./motifs";
import { SOCIAL_LINKS, ENROLMENT_FORM_URL } from "@/lib/site";
import { ayahOfTheDay } from "@/lib/ayahs";

type UpcomingClass = {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  isLive: boolean;
};

type NewsItem = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
};

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  createdAt: string;
  author: { id: string; name: string };
};


function fmtWhen(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const day = d.toDateString() === today.toDateString() ? "Today"
    : d.toDateString() === tomorrow.toDateString() ? "Tomorrow"
    : d.toLocaleDateString(undefined, { weekday: "short" });
  return `${day} · ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function fmtAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export default function HomeClient() {
  const [tab, setTab] = useState("home");
  const router = useRouter();
  const [upcoming, setUpcoming] = useState<UpcomingClass[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  // Recompute on mount; rotates once per local calendar day.
  const [ayah] = useState(() => ayahOfTheDay());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const homeRes = await fetch("/api/public/home")
          .then(r => r.ok ? r.json() : null)
          .catch(() => null);
        if (cancelled) return;
        if (homeRes) {
          setUpcoming(homeRes.upcomingClasses ?? []);
          setNews(homeRes.news ?? []);
          setPosts(homeRes.posts ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const pinned = news.find(n => n.pinned) ?? news[0];
  const otherNews = news.filter(n => n.id !== pinned?.id).slice(0, 2);

  return (
    <div className="app">
      <AppBar active={tab} onNav={setTab} showSearch />
      <div className="app-scroll">

        <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--hairline)" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, var(--mint-bg) 0%, var(--bg) 60%, var(--bg) 100%)" }} />
          <Breeze opacity={0.35} color="var(--c-mid)" />
          <div style={{ position: "absolute", top: -80, right: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in oklch, var(--accent-500) 22%, transparent), transparent 70%)" }} />

          <div className="responsive-grid" style={{ position: "relative", maxWidth: 1180, margin: "0 auto", padding: "88px 32px 80px", display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 64, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 14px 6px 6px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--hairline)", marginBottom: 26 }}>
                <span style={{ width: 24, height: 24, borderRadius: 999, background: "var(--brand-700)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Icon name="wind" size={13} /></span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-2)", letterSpacing: "0.02em" }}>nasym · the gentle breeze of mercy</span>
              </div>
              <h1 className="serif hero-title" style={{ fontSize: 76, fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.0, margin: "8px 0 0", color: "var(--ink)" }}>
                Where the breeze<br />
                of <em style={{ color: "var(--brand-700)", fontStyle: "italic" }}>raḥmah</em> reaches<br />
                the <em style={{ color: "var(--accent-600)", fontStyle: "italic" }}>young heart</em>.
              </h1>
              <p style={{ marginTop: 28, fontSize: 18, lineHeight: 1.6, color: "var(--ink-2)", maxWidth: 520 }}>
                Live classrooms, recorded lessons, and daily reflections — taught with care, designed for the way you learn now.
              </p>
              <div style={{ marginTop: 36, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href={ENROLMENT_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-lg">Apply for admission <Icon name="arrow-right" size={16} /></a>
                <button className="btn btn-secondary btn-lg" onClick={() => router.push("/courses")}><Icon name="book" size={14} /> Browse courses</button>
              </div>
              <p style={{ marginTop: 14, fontSize: 12, color: "var(--ink-3)" }}>
                Already enrolled? <a onClick={() => router.push("/auth/signin")} style={{ color: "var(--brand-700)", fontWeight: 600, cursor: "pointer" }}>Sign in</a>
              </p>
            </div>

            <div style={{ position: "relative", padding: 4, borderRadius: 28, background: "linear-gradient(160deg, var(--mint-300), var(--accent-300))", boxShadow: "var(--shadow-3)" }}>
              <div className="hero-card-pad" style={{ background: "var(--surface)", borderRadius: 24, padding: 36, position: "relative", overflow: "hidden" }}>
                <KhatamPattern opacity={0.05} color="var(--brand-700)" />
                <div style={{ position: "absolute", top: 22, right: 22, opacity: 0.4 }}><LeafSprig size={36} /></div>
                <div style={{ position: "relative" }}>
                  <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--accent-500)" }} /> Āyah of the day
                  </div>
                  <p className="arabic" dir="rtl" style={{ fontSize: 46, fontWeight: 700, color: "var(--brand-800)", margin: "22px 0 14px", textAlign: "right", lineHeight: 1.4 }}>{ayah.arabic}</p>
                  <p className="serif" style={{ fontStyle: "italic", color: "var(--ink-3)", fontSize: 16, margin: 0, fontWeight: 500 }}>{ayah.translit}</p>
                  <p className="serif" style={{ marginTop: 16, fontSize: 22, color: "var(--ink)", lineHeight: 1.4, fontWeight: 500 }}>{ayah.meaning}</p>
                  <hr className="divider" style={{ margin: "24px 0" }} />
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>{ayah.ref}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 32px 24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
            <div>
              <div className="eyebrow">Live this week</div>
              <h2 className="serif" style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.02em", margin: "8px 0 0" }}>Upcoming classes</h2>
            </div>
            <a onClick={() => router.push("/classes")} style={{ color: "var(--brand-700)", fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>See all <Icon name="arrow-right" size={12} /></a>
          </div>

          {loading ? (
            <div style={{ color: "var(--ink-3)", fontSize: 15 }}>Loading…</div>
          ) : upcoming.length === 0 ? (
            <div className="surface" style={{ padding: 36, textAlign: "center", color: "var(--ink-3)" }}>
              No upcoming live classes scheduled. Check the <a onClick={() => router.push("/courses")} style={{ color: "var(--brand-700)", cursor: "pointer" }}>courses page</a> for recorded series.
            </div>
          ) : (
            <div className="responsive-grid grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {upcoming.slice(0, 3).map((c, i) => (
                <div key={c.id} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 148, position: "relative", background: i === 0 ? "linear-gradient(135deg, var(--brand-700), var(--brand-900))" : i === 1 ? "linear-gradient(135deg, var(--c-mid), var(--brand-700))" : "linear-gradient(135deg, var(--accent-500), var(--accent-600))" }}>
                    <Breeze opacity={0.3} color="white" />
                    {c.isLive && <span className="chip chip-live" style={{ position: "absolute", top: 14, left: 14 }}>LIVE NOW</span>}
                    <span style={{ position: "absolute", bottom: 14, left: 16, color: "white", fontSize: 12, fontWeight: 600, opacity: 0.9, letterSpacing: "0.04em" }}>{fmtWhen(c.scheduledAt).toUpperCase()}</span>
                    <span style={{ position: "absolute", top: 14, right: 14, color: "white", opacity: 0.7 }}><LeafSprig size={26} color="white" /></span>
                  </div>
                  <div className="card-pad" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 className="serif" style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{c.title}</h3>
                    <p style={{ margin: "6px 0 18px", color: "var(--ink-3)", fontSize: 13, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</p>
                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                      <button onClick={() => router.push("/classes")} className={c.isLive ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}>{c.isLive ? "Join now" : "View details"}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 32px" }}>
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1.25fr .85fr", gap: 36 }}>
            <div>
              <div className="eyebrow">Daily on the journal</div>
              <h2 className="serif" style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", margin: "8px 0 22px" }}>Reflections</h2>
              {posts.length === 0 ? (
                <div className="surface" style={{ padding: 30, textAlign: "center", color: "var(--ink-3)" }}>
                  No reflections published yet.
                </div>
              ) : (
                <div className="card" style={{ overflow: "hidden" }}>
                  {posts.slice(0, 3).map((p, i) => (
                    <div key={p.id} onClick={() => router.push(`/blog/${p.slug}`)} style={{ padding: "22px 24px", borderTop: i ? "1px solid var(--hairline)" : "none", display: "flex", gap: 20, alignItems: "center", cursor: "pointer" }}>
                      <div style={{ width: 78, height: 78, borderRadius: 14, background: i === 0 ? "var(--mint-bg)" : i === 1 ? "var(--accent-50)" : "var(--brand-50)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: i === 0 ? "var(--brand-700)" : i === 1 ? "var(--accent-600)" : "var(--brand-800)" }}>
                        <Icon name={i === 0 ? "leaf" : i === 1 ? "book" : "chat"} size={26} stroke={1.4} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className={i === 0 ? "chip chip-mint" : i === 1 ? "chip chip-camel" : "chip chip-brand"}>{p.author.name}</span>
                        <h3 className="serif" style={{ margin: "10px 0 4px", fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.25 }}>{p.title}</h3>
                        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-3)" }}>{fmtAgo(p.createdAt)}</p>
                      </div>
                      <Icon name="arrow-right" size={16} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="eyebrow">News</div>
              <h2 className="serif" style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", margin: "8px 0 22px" }}>Announcements</h2>
              {!pinned ? (
                <div className="surface" style={{ padding: 30, textAlign: "center", color: "var(--ink-3)" }}>
                  No announcements yet.
                </div>
              ) : (
                <>
                  <div className="card card-pad" style={{ background: "linear-gradient(160deg, var(--brand-700), var(--brand-900))", color: "var(--surface)", border: "none", position: "relative", overflow: "hidden", cursor: "pointer" }} onClick={() => router.push("/news")}>
                    <Breeze opacity={0.18} color="white" />
                    <div style={{ position: "relative" }}>
                      {pinned.pinned && <span className="chip" style={{ background: "rgba(255,255,255,0.16)", color: "white", borderColor: "rgba(255,255,255,0.25)" }}>📌 Pinned</span>}
                      <h3 className="serif" style={{ margin: "14px 0 8px", fontSize: 22, fontWeight: 500, letterSpacing: "-0.01em" }}>{pinned.title}</h3>
                      <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.82)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{pinned.body}</p>
                      <button className="btn btn-mint btn-sm" style={{ marginTop: 18 }}>Read more <Icon name="arrow-right" size={12} /></button>
                    </div>
                  </div>
                  {otherNews.map(n => (
                    <div key={n.id} className="card card-pad" style={{ marginTop: 14, cursor: "pointer" }} onClick={() => router.push("/news")}>
                      <span style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{fmtAgo(n.createdAt)}</span>
                      <h3 className="serif" style={{ margin: "8px 0 6px", fontSize: 20, fontWeight: 500 }}>{n.title}</h3>
                      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.body}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>

        <section style={{ background: "var(--brand-900)", color: "var(--surface)", padding: "56px 32px", position: "relative", overflow: "hidden" }}>
          <Breeze opacity={0.18} color="var(--mint-300)" />
          <div style={{ position: "relative", maxWidth: 1180, margin: "0 auto" }}>
            <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: 40 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 38, height: 38, borderRadius: 12, background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}><LogoMark size={32} /></span>
                  <div className="serif" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "0.04em" }}>NASYM UR RAHMAH</div>
                </div>
                <p style={{ marginTop: 16, color: "rgba(255,255,255,0.65)", fontSize: 13, maxWidth: 480 }}>An open Islamic learning space. Free for students. Built with sincerity.</p>
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <button onClick={() => router.push("/auth/signin")} className="btn" style={{ background: "transparent", color: "var(--surface)", borderColor: "rgba(255,255,255,0.3)" }}>Sign in</button>
                  <a href={ENROLMENT_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-mint">Apply for admission</a>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 14 }}>Connect</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <SocialLink href={SOCIAL_LINKS.instagram} label="Instagram" handle="@nasymurrahmah" />
                  <SocialLink href={SOCIAL_LINKS.facebook} label="Facebook" handle="Nasym-ur-Rahmah" />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 14 }}>Learn</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <FooterLink onClick={() => router.push("/courses")}>Courses</FooterLink>
                  <FooterLink onClick={() => router.push("/lessons")}>Lessons</FooterLink>
                  <FooterLink onClick={() => router.push("/classes")}>Live classes</FooterLink>
                  <FooterLink onClick={() => router.push("/blog")}>Reflections</FooterLink>
                  <FooterLink onClick={() => router.push("/ask")}>Ask a question</FooterLink>
                </div>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.12)", margin: "36px 0 22px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.55)", fontSize: 12, flexWrap: "wrap", gap: 10 }}>
              <span>© {new Date().getFullYear()} Nasym-ur-Rahmah</span>
              <span className="serif" style={{ fontStyle: "italic" }}>“And remind, for indeed, the reminder benefits the believers.” (51:55)</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

const SocialLink = ({ href, label, handle }: { href: string; label: string; handle: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--surface)", textDecoration: "none", display: "flex", flexDirection: "column", gap: 2 }}>
    <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{handle}</span>
  </a>
);

const FooterLink = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <a onClick={onClick} style={{ color: "rgba(255,255,255,0.78)", fontSize: 14, cursor: "pointer", textDecoration: "none" }}>{children}</a>
);
